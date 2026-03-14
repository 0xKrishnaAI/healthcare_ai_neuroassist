import torch
import numpy as np
import pandas as pd
from tqdm import tqdm
from sklearn.svm import SVC
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
import joblib
import logging
from Task2_binary_classifier import get_resnet_model, MRIDataset, get_transforms, filter_and_remap, DEVICE, BATCH_SIZE, NUM_WORKERS
from torch.utils.data import DataLoader

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def extract_features(model, loader):
    """
    Passes images through ResNet18 and extracts the 512-dim feature vector
    from the layer just before the final classification head.
    """
    model.eval()
    features = []
    labels_list = []
    
    # Hook to capture features from the layer before the final FC
    # ResNet18 structure: ... -> avgpool -> fc
    # We want output of avgpool (flattened)
    
    # Easier way: Remove the FC layer temporarily or just generic forward pass up to fc
    # But since we defined model.fc as a Sequential(Dropout, Linear), we can just grabbing the input to it is tricky via hooks.
    # Alternative: Define a FeatureExtractor class wrapper.
    
    # We'll use a forward hook on the average pooling layer (which feeds into FC)
    activation = {}
    def get_activation(name):
        def hook(model, input, output):
            activation[name] = output.detach()
        return hook

    # Register hook on avgpool layer
    # ResNet18 standard structure has 'avgpool'
    model.avgpool.register_forward_hook(get_activation('avgpool'))
    
    print("Extracting features...", flush=True)
    with torch.no_grad():
        for images, labels in tqdm(loader, desc="Feature Extraction"):
            images = images.to(DEVICE)
            
            # Forward pass
            _ = model(images)
            
            # Get captured feature
            # shape: (batch, 512, 1, 1) -> flatten to (batch, 512)
            feat = activation['avgpool'].squeeze().cpu().numpy()
            
            # Handle batch size 1 edge case where squeeze might remove too many dims
            if len(feat.shape) == 1:
                feat = feat.reshape(1, -1)
                
            features.append(feat)
            labels_list.append(labels.numpy())
            
    features = np.vstack(features)
    labels = np.concatenate(labels_list)
    return features, labels

def main():
    try:
        # 1. Load Data
        train_df = filter_and_remap(pd.read_csv('train.csv'))
        val_df = filter_and_remap(pd.read_csv('val.csv'))
        test_df = filter_and_remap(pd.read_csv('test.csv'))
        
        # Merge Train+Val for SVM training to maximize data usage (Common in small datasets)
        # Using more data for the SVM is crucial for that 91% goal.
        train_val_df = pd.concat([train_df, val_df], ignore_index=True)
        
        # Dataset setup
        # Use Validation transforms (No augmentation) for feature extraction to get stable features
        # Or should we augment train? SVMs usually prefer clean features. Let's stick to No Augmentation first.
        train_ds = MRIDataset(train_val_df, mode='2d', transform=get_transforms('val'))
        test_ds = MRIDataset(test_df, mode='2d', transform=get_transforms('test'))
        
        train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=False, num_workers=NUM_WORKERS)
        test_loader = DataLoader(test_ds, batch_size=BATCH_SIZE, shuffle=False, num_workers=NUM_WORKERS)
        
        # 2. Load Pretrained ResNet
        print("Loading ResNet18 Feature Extractor...", flush=True)
        model = get_resnet_model(num_classes=2)
        # Load the weights we just trained (Transfer Learning) - they sort of adapted to MRI already
        try:
            model.load_state_dict(torch.load('binary_ad_classifier.pth', map_location=DEVICE))
            print("Loaded fine-tuned MRI weights.", flush=True)
        except Exception as e:
            print(f"Warning: Could not load trained weights ({e}), using ImageNet weights.", flush=True)
            
        model.to(DEVICE)
        
        # 3. Extract Features
        X_train, y_train = extract_features(model, train_loader)
        X_test, y_test = extract_features(model, test_loader)
        
        print(f"Feature Shape: {X_train.shape}", flush=True)
        
        # 4. Train SVM
        print("Training SVM Classifier...", flush=True)
        # Pipeline: Scale features -> SVM
        # C=1.0 is default, we might tune it. RBF kernel is standard. 
        # probability=True allows predict_proba (no hallucination Check)
        svm = make_pipeline(
            StandardScaler(),
            SVC(C=1.5, kernel='rbf', probability=True, random_state=42) 
        )
        
        svm.fit(X_train, y_train)
        
        # 5. Evaluate
        print("\nEvaluating SVM...", flush=True)
        y_pred = svm.predict(X_test)
        
        acc = accuracy_score(y_test, y_pred)
        cm = confusion_matrix(y_test, y_pred)
        
        print(f"\nFinal Hybrid Accuracy: {acc:.4f}", flush=True)
        print("Confusion Matrix:")
        print(cm)
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred, target_names=['CN', 'AD']))
        
        if acc > 0.90:
            print("\nSUCCESS: Hybrid Approach hit >90%!", flush=True)
        else:
            print("\nResult: Accuracy improved but data constraints remain.", flush=True)

        # Save model
        joblib.dump(svm, 'hybrid_svm_model.pkl')
        print("Saved SVM model to 'hybrid_svm_model.pkl'", flush=True)
        
    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)

if __name__ == "__main__":
    main()
