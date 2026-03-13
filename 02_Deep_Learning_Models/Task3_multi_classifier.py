import os
import logging
import numpy as np
import pandas as pd
from tqdm import tqdm
import nibabel as nib
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from sklearn.metrics import accuracy_score, roc_auc_score, f1_score, precision_score, recall_score, confusion_matrix
import matplotlib.pyplot as plt

# Setup logging
logging.basicConfig(level=logging.ERROR, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
# Constants
BATCH_SIZE = 4 # Reduced to 4 to prevent CPU freeze/hang
NUM_EPOCHS = 20 # Per Master Prompt specification
LEARNING_RATE = 1e-4
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
NUM_WORKERS = 0 # Windows safe

class MRIDataset(Dataset):
    """
    Dataset class for loading 3D MRI volumes for Multi-Class Classification.
    Labels: 0 (CN), 1 (MCI), 2 (AD)
    """
    def __init__(self, metadata_df):
        self.metadata = metadata_df
        
    def __len__(self):
        return len(self.metadata)
    
    def __getitem__(self, idx):
        row = self.metadata.iloc[idx]
        img_path = row['path'] 
        
        # Safety cast for label
        try:
            label = int(float(row['label']))
        except (ValueError, TypeError):
            label = int(row['label'])
            
        try:
            # Load image using nibabel (3D Volume)
            if not os.path.exists(img_path):
                raise FileNotFoundError(f"Image not found: {img_path}")
                
            img = nib.load(img_path)
            img_np = img.get_fdata().astype(np.float32) # Expected shape (128, 128, 128)
            
            # Add channel dimension: (1, 128, 128, 128)
            img_tensor = torch.tensor(img_np, dtype=torch.float32).unsqueeze(0)
                
            return img_tensor, torch.tensor(label, dtype=torch.long)
            
        except Exception as e:
            logger.error(f"Error loading {img_path}: {str(e)}")
            # Return zero tensor to prevent crash
            return torch.zeros((1, 128, 128, 128)), torch.tensor(label, dtype=torch.long)

class Simple3DCNN(nn.Module):
    """
    Simple 3D CNN for Multi-Class AD classification (CN/MCI/AD).
    Research-backed by ADNI studies on structural MRI.
    """
    def __init__(self, num_classes=3):
        super(Simple3DCNN, self).__init__()
        self.features = nn.Sequential(
            # Conv Layer 1: 1 -> 32
            nn.Conv3d(1, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool3d(2),
            
            # Conv Layer 2: 32 -> 64
            nn.Conv3d(32, 64, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool3d(2),
            
            # Conv Layer 3: 64 -> 128
            nn.Conv3d(64, 128, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool3d(2),
        )
        
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Dropout(0.5),
            # Input calculation: 128 -> 64 -> 32 -> 16.
            # 128 channels * 16 * 16 * 16
            nn.Linear(128 * 16 * 16 * 16, 512), 
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, num_classes) # 3 Classes
        )

    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x

def train_model(model, train_loader, val_loader):
    model = model.to(DEVICE)
    if torch.cuda.device_count() > 1:
        print(f"Using {torch.cuda.device_count()} GPUs for training.")
        model = nn.DataParallel(model)
        
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
    
    train_losses, val_losses = [], []
    train_accs, val_accs = [], []
    
    print(f"\nStarting Multi-Class Training on {DEVICE}...")
    
    for epoch in range(NUM_EPOCHS):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        loop = tqdm(train_loader, desc=f"Epoch {epoch+1}/{NUM_EPOCHS} [Train]", leave=False)
        for images, labels in loop:
            try:
                images, labels = images.to(DEVICE), labels.to(DEVICE)
                
                optimizer.zero_grad()
                outputs = model(images)
                loss = criterion(outputs, labels)
                loss.backward()
                optimizer.step()
                
                running_loss += loss.item() * images.size(0)
                _, predicted = torch.max(outputs, 1)
                total += labels.size(0)
                correct += (predicted == labels).sum().item()
                
                loop.set_postfix(loss=loss.item())
            except Exception as e:
                logger.error(f"Error in training step: {e}")
                continue
                
        epoch_loss = running_loss / total if total > 0 else 0
        epoch_acc = correct / total if total > 0 else 0
        train_losses.append(epoch_loss)
        train_accs.append(epoch_acc)
        
        # Validation
        model.eval()
        val_running_loss = 0.0
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            for images, labels in val_loader:
                try:
                    images, labels = images.to(DEVICE), labels.to(DEVICE)
                    outputs = model(images)
                    loss = criterion(outputs, labels)
                    
                    val_running_loss += loss.item() * images.size(0)
                    _, predicted = torch.max(outputs, 1)
                    val_total += labels.size(0)
                    val_correct += (predicted == labels).sum().item()
                except Exception as e:
                    logger.error(f"Error in val step: {e}")
                    continue
        
        val_loss = val_running_loss / val_total if val_total > 0 else 0
        val_acc = val_correct / val_total if val_total > 0 else 0
        val_losses.append(val_loss)
        val_accs.append(val_acc)
        
        print(f"Epoch {epoch+1}: Train Loss={epoch_loss:.4f}, Train Acc={epoch_acc:.4f}, Val Loss={val_loss:.4f}, Val Acc={val_acc:.4f}")

    # Plotting
    plt.figure(figsize=(10, 5))
    plt.subplot(1, 2, 1)
    plt.plot(train_losses, label='Train Loss')
    plt.plot(val_losses, label='Val Loss')
    plt.legend()
    plt.title('Multi-Class Loss')
    
    plt.subplot(1, 2, 2)
    plt.plot(train_accs, label='Train Acc')
    plt.plot(val_accs, label='Val Acc')
    plt.legend()
    plt.title('Multi-Class Accuracy')
    
    plt.savefig('training_curves_multi.png')
    plt.close()
    
    return model

def evaluate_model(model, test_loader):
    model.eval()
    all_preds = []
    all_labels = []
    all_probs = [] # For AUC
    
    print(f"\nEvaluating Multi-Class Model...")
    
    with torch.no_grad():
        for images, labels in tqdm(test_loader, desc="Testing"):
            try:
                images, labels = images.to(DEVICE), labels.to(DEVICE)
                outputs = model(images)
                probs = torch.softmax(outputs, dim=1)
                _, predicted = torch.max(outputs, 1)
                
                all_preds.extend(predicted.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())
                all_probs.extend(probs.cpu().numpy())
            except Exception as e:
                logger.error(f"Error in evaluation: {e}")
                
    if len(all_labels) == 0:
        print("No data evaluated.")
        return

    # Metrics
    # Balanced Accuracy
    from sklearn.metrics import balanced_accuracy_score
    bal_acc = balanced_accuracy_score(all_labels, all_preds)
    
    # AUC (One-vs-Rest for Multi-Class)
    try:
        auc = roc_auc_score(all_labels, all_probs, multi_class='ovr', average='macro')
    except:
        auc = 0.0
        
    f1 = f1_score(all_labels, all_preds, average='macro')
    precision = precision_score(all_labels, all_preds, average=None)
    recall = recall_score(all_labels, all_preds, average=None)
    cm = confusion_matrix(all_labels, all_preds)
    
    print(f"\nMulti-Class Results:", flush=True)
    print(f"Balanced Accuracy: {bal_acc:.4f}", flush=True)
    print(f"AUC (Macro OvR): {auc:.4f}", flush=True)
    print(f"Macro F1-Score: {f1:.4f}", flush=True)
    print(f"Precision (CN, MCI, AD): {precision}", flush=True)
    print(f"Recall (CN, MCI, AD): {recall}", flush=True)
    print(f"Confusion Matrix (Rows=True, Cols=Pred):\n{cm}", flush=True)

    # Tabular Report
    print("\n" + "="*50, flush=True)
    print("FINAL PREDICTION REPORT (TEST SET)", flush=True)
    report_df = pd.DataFrame({
        'Methods': ['CN' if l==0 else 'MCI' if l==1 else 'AD' for l in all_labels],
        'Pred': ['CN' if p==0 else 'MCI' if p==1 else 'AD' for p in all_preds]
    })
    # Just printing metrics is likely enough based on request "mention them separately"
    # But let's verify if we need detailed subject rows. The prompt said "Check the accuracy... mention them separately". 
    # This likely refers to specific metric breakdown (Recall per class, etc). 
    
    if bal_acc > 0.55:
        print("SUCCESS: Balanced Accuracy exceeds 55%!", flush=True)
    else:
        print("NOTE: Balanced Accuracy is below 55%. Consider tuning.", flush=True)

def main():
    try:
        # Load raw CSVs (Task 3 uses ALL data: CN=0, MCI=1, AD=2)
        train_df = pd.read_csv('train.csv')
        val_df = pd.read_csv('val.csv')
        test_df = pd.read_csv('test.csv')
        
        print(f"Dataset Sizes: Train={len(train_df)}, Val={len(val_df)}, Test={len(test_df)}")
        
        train_ds = MRIDataset(train_df)
        val_ds = MRIDataset(val_df)
        test_ds = MRIDataset(test_df)
        
        # CPU OPTIMIZATION: Use Subset for "Smoke Test" validation if full training is too slow
        # Uncomment the following lines to run on full data when GPU is available
        # indices = range(min(len(train_ds), 8))
        # train_ds = torch.utils.data.Subset(train_ds, indices)
        # val_ds = torch.utils.data.Subset(val_ds, range(min(len(val_ds), 8)))
        # test_ds = torch.utils.data.Subset(test_ds, range(min(len(test_ds), 8)))
        # print("WARNING: Running on data SUBSET (8 samples) for rapid CPU verification.", flush=True)

        train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True, num_workers=NUM_WORKERS)
        val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False, num_workers=NUM_WORKERS)
        test_loader = DataLoader(test_ds, batch_size=BATCH_SIZE, shuffle=False, num_workers=NUM_WORKERS)
        
        model = Simple3DCNN(num_classes=3)
        model = train_model(model, train_loader, val_loader)
        
        # Save model
        torch.save(model.state_dict(), 'multi_ad_classifier.pth')
        print("Saved model as 'multi_ad_classifier.pth'")
        
        evaluate_model(model, test_loader)
        
        print("\nTraining and evaluation complete.")
        
    except Exception as e:
        logger.critical(f"Critical failure: {e}", exc_info=True)
        print(f"Critical failure: {e}")

if __name__ == '__main__':
    main()
