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
from torchvision import transforms, models
import torchvision.transforms.functional as TF
from sklearn.metrics import accuracy_score, roc_auc_score, f1_score, precision_score, recall_score, confusion_matrix
import matplotlib.pyplot as plt

# Setup logging
logging.basicConfig(level=logging.ERROR, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
BATCH_SIZE = 4 # Per Master Prompt: optimized for memory
NUM_EPOCHS = 5 # Reduced for practical training time (can increase later)
LEARNING_RATE = 1e-4
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
NUM_WORKERS = 0 # Safe for Windows. adjust if needed.

# Helper function defined globally to be importable
def filter_and_remap(df):
    """
    Filters DataFrame for CN (0) and AD (2) classes and remaps AD to 1.
    """
    # Check if 'label' column exists
    if 'label' not in df.columns:
       # Fallback or error if structure is unexpected
       raise ValueError("DataFrame missing required 'label' column")
    
    df_binary = df[df['label'].isin([0, 2])].copy()
    # Remap: 0->0 (CN), 2->1 (AD)
    df_binary['label'] = df_binary['label'].map({0: 0, 2: 1})
    # Also ensure 'label_num' exists for compatibility
    df_binary['label_num'] = df_binary['label'] 
    return df_binary

def get_transforms(phase):
    """
    Returns transforms for data augmentation.
    """
    if phase == 'train':
        return transforms.Compose([
            # Note: Resize is handled inside MRIDataset via F.interpolate for float tensors
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomRotation(degrees=15), # Increased rotation
            transforms.ColorJitter(brightness=0.2, contrast=0.2), # Added intensity variation
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]) # ImageNet stats
        ])
    else:
        return transforms.Compose([
            # Note: Resize is handled inside MRIDataset via F.interpolate for float tensors
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

class MRIDataset(Dataset):
    """
    Dataset class for loading MRI volumes. 
    Supports both 3D volumes and 2D middle-slice extraction.
    """
    def __init__(self, metadata_df, mode='3d', transform=None):
        self.metadata = metadata_df
        self.mode = mode.lower()
        self.transform = transform
        
    def __len__(self):
        return len(self.metadata)
    
    def __getitem__(self, idx):
        row = self.metadata.iloc[idx]
        img_path = row['path'] # The CSV header is 'path', not 'processed_path'
        # Safety cast: Handle floats or strings that look like floats
        try:
            label = int(float(row['label']))
        except (ValueError, TypeError):
            label = int(row['label'])  # Fallback
        
        try:
            # Load image using nibabel
            if not os.path.exists(img_path):
                raise FileNotFoundError(f"Image not found: {img_path}")
                
            img = nib.load(img_path)
            img_np = img.get_fdata().astype(np.float32) # Expected shape (128, 128, 128)
            
            if self.mode == '3d':
                # Add channel dimension: (1, 128, 128, 128)
                img_tensor = torch.tensor(img_np, dtype=torch.float32).unsqueeze(0)
            elif self.mode == '2d':
                # Extract 3 slices: Middle-1, Middle, Middle+1 for RGB-like context
                mid_idx = img_np.shape[2] // 2
                
                # Check bounds
                start_idx = max(0, mid_idx - 1)
                end_idx = min(img_np.shape[2], mid_idx + 2)
                
                # Extract slices
                slices = []
                for i in range(mid_idx - 1, mid_idx + 2):
                    # Handle edge cases by padding if needed, but mid-slice usually safe
                    idx_to_use = max(0, min(img_np.shape[2]-1, i))
                    slices.append(img_np[:, :, idx_to_use])
                
                # Stack to create (3, 128, 128)
                img_stack = np.stack(slices, axis=0)
                img_tensor = torch.tensor(img_stack, dtype=torch.float32)
                
                # Normalize to 0-1 range roughly if raw MRI isn't already (usually max is varied)
                # Simple min-max scaling per image is good practice before ImageNet norm
                img_min, img_max = img_tensor.min(), img_tensor.max()
                if img_max > img_min:
                    img_tensor = (img_tensor - img_min) / (img_max - img_min)
                
                # Resize to 224x224 for ResNet (using interpolate to handle float tensors)
                import torch.nn.functional as F
                img_tensor = F.interpolate(
                    img_tensor.unsqueeze(0), size=(224, 224),
                    mode='bilinear', align_corners=False
                ).squeeze(0)
                
            else:
                raise ValueError("Mode must be '2d' or '3d'")
            
            # Apply transforms if 2d (transforms usually expect PIL or Tensor)
            # Our tensor is (C, H, W). torchvision transforms work on this.
            if self.mode == '2d' and self.transform:
                img_tensor = self.transform(img_tensor)
                
            return img_tensor, torch.tensor(label, dtype=torch.long)
            
        except Exception as e:
            logger.error(f"Error loading {img_path}: {str(e)}")
            # Return zero tensor in case of error to prevent crash
            if self.mode == '3d':
                return torch.zeros((1, 128, 128, 128)), torch.tensor(label, dtype=torch.long)
            else:
                # Must match model input: 3 channels, 224x224 (after resize)
                return torch.zeros((3, 224, 224)), torch.tensor(label, dtype=torch.long)

class Simple3DCNN(nn.Module):
    """
    Simple 3D CNN for AD classification, research-backed by ADNI studies on structural MRI for binary CN/AD tasks.
    """
    def __init__(self):
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
            # Input size calculation: 128 -> 64 -> 32 -> 16. 
            # 16*16*16 * 128 = 524288 parameters. This might be large.
            # Let's add an AdaptiveAvgPool to reduce size before dense layers if needed, 
            # but following the prompt: flattened to 512.
            # 128 * 16 * 16 * 16 = 524288
            nn.Linear(128 * 16 * 16 * 16, 512), 
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, 2)
        )

    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x

class Simple2DCNN(nn.Module):
    """
    Simple 2D CNN extracting features from the middle axial slice. 
    Often used as a lightweight baseline or complementary approach.
    """
    def __init__(self):
        super(Simple2DCNN, self).__init__()
        self.features = nn.Sequential(
            # Conv Layer 1: 1 -> 32
            nn.Conv2d(1, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32), # Added Batch Norm
            nn.ReLU(),
            nn.MaxPool2d(2),
            
            # Conv Layer 2: 32 -> 64
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64), # Added Batch Norm
            nn.ReLU(),
            nn.MaxPool2d(2),
            
            # Conv Layer 3: 64 -> 128
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128), # Added Batch Norm
            nn.ReLU(),
            nn.MaxPool2d(2),
        )
        
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Dropout(0.5),
            # 128 * 16 * 16
            nn.Linear(128 * 16 * 16, 512),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, 2)
        )

    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x

def get_resnet_model(num_classes=2):
    """
    Returns a ResNet18 model pretrained on ImageNet, adapted for our task.
    """
    print("Loading Pretrained ResNet18...")
    model = models.resnet18(weights='IMAGENET1K_V1')
    
    # Freeze early layers (Transfer Learning)
    # Freeze all params first
    for param in model.parameters():
        param.requires_grad = False
        
    # Unfreeze layer3, layer4 and fc
    for param in model.layer3.parameters():
        param.requires_grad = True
    for param in model.layer4.parameters():
        param.requires_grad = True
        
    # Modify the final fully connected layer
    num_ftrs = model.fc.in_features
    # Add Dropout for regularization
    model.fc = nn.Sequential(
        nn.Dropout(0.5),
        nn.Linear(num_ftrs, num_classes)
    )
    
    return model

def train_model(model, train_loader, val_loader, model_name="model"):
    model = model.to(DEVICE)
    if torch.cuda.device_count() > 1:
        print(f"Using {torch.cuda.device_count()} GPUs for training.")
        model = nn.DataParallel(model)
        
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=1e-4, weight_decay=1e-4) # Reduced weight decay back to standard
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=15, gamma=0.1)
    
    train_losses, val_losses = [], []
    train_accs, val_accs = [], []
    
    print(f"\nStarting training for {model_name} on {DEVICE}...")
    
    for epoch in range(NUM_EPOCHS):
        # Training Phase
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
        
        # Step the scheduler
        scheduler.step()
                
        epoch_loss = running_loss / total if total > 0 else 0
        epoch_acc = correct / total if total > 0 else 0
        train_losses.append(epoch_loss)
        train_accs.append(epoch_acc)
        
        # Validation Phase
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
                    logger.error(f"Error in validation step: {e}")
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
    plt.title(f'{model_name} Loss')
    
    plt.subplot(1, 2, 2)
    plt.plot(train_accs, label='Train Acc')
    plt.plot(val_accs, label='Val Acc')
    plt.legend()
    plt.title(f'{model_name} Accuracy')
    
    plt.savefig(f'{model_name}_training_curves.png')
    plt.close()
    
    return model

def evaluate_model(model, test_loader, model_name="model"):
    model.eval()
    all_preds = []
    all_labels = []
    all_probs = []
    
    print(f"\nEvaluating {model_name}...")
    
    with torch.no_grad():
        for images, labels in tqdm(test_loader, desc="Testing"):
            try:
                images, labels = images.to(DEVICE), labels.to(DEVICE)
                outputs = model(images)
                probs = torch.softmax(outputs, dim=1)[:, 1] # Probability of AD (class 1)
                _, predicted = torch.max(outputs, 1)
                
                all_preds.extend(predicted.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())
                all_probs.extend(probs.cpu().numpy())
            except Exception as e:
                logger.error(f"Error in evaluation step: {e}")
                
    # Metrics
    if len(all_labels) == 0:
        print("No data evaluated.")
        return

    bal_acc = accuracy_score(all_labels, all_preds) # Balanced if dataset is balanced, but prompt asks for 'Balanced Accuracy' specifically
    # Actually sklearn has balanced_accuracy_score
    from sklearn.metrics import balanced_accuracy_score
    bal_acc = balanced_accuracy_score(all_labels, all_preds)
    
    try:
        auc = roc_auc_score(all_labels, all_probs)
    except:
        auc = 0.0 # Handle case with only one class
        
    f1 = f1_score(all_labels, all_preds, average='macro')
    precision = precision_score(all_labels, all_preds, average=None)
    recall = recall_score(all_labels, all_preds, average=None)
    cm = confusion_matrix(all_labels, all_preds)
    
    print(f"\nResults for {model_name}:")
    print(f"Balanced Accuracy: {bal_acc:.4f}")
    print(f"AUC: {auc:.4f}")
    print(f"Macro F1-Score: {f1:.4f}")
    print(f"Precision (CN, AD): {precision}")
    print(f"Recall (CN, AD): {recall}")
    print(f"Confusion Matrix:\n{cm}")
    
    if bal_acc > 0.91:
        print("SUCCESS: Balanced Accuracy exceeds 91%!")
    else:
        print("NOTE: Balanced Accuracy is below 91%. Consider tuning hyperparameters, increasing epochs, or checking data quality.")

def main():
    try:
        # 1. Load DataFrames
        train_df = pd.read_csv('train.csv')
        val_df = pd.read_csv('val.csv')
        test_df = pd.read_csv('test.csv')
        
        # 2. Filter for CN (0) and AD (2) only
        # The CSV contains 'label' column with 0, 1, 2.
        # We need to filter out MCI (1) and remap AD (2) to 1.
        
        # Helper function is now global
        train_binary = filter_and_remap(train_df)
        val_binary = filter_and_remap(val_df)
        test_binary = filter_and_remap(test_df)
        
        print(f"Binary Dataset Sizes: Train={len(train_binary)}, Val={len(val_binary)}, Test={len(test_binary)}")
        
        
        # ---------------------------------------------------------
        # 3D Model Execution (Master Prompt Specification)
        # ---------------------------------------------------------
        print("\n" + "="*30)
        print("Running 3D CNN Pipeline (Master Prompt)")
        print("="*30)
        
        # Create 3D datasets (no transforms for 3D)
        train_ds_3d = MRIDataset(train_binary, mode='3d')
        val_ds_3d = MRIDataset(val_binary, mode='3d')
        test_ds_3d = MRIDataset(test_binary, mode='3d')
        
        # Smaller batch size for 3D (memory intensive)
        BATCH_SIZE_3D = 2
        train_loader_3d = DataLoader(train_ds_3d, batch_size=BATCH_SIZE_3D, shuffle=True, num_workers=NUM_WORKERS)
        val_loader_3d = DataLoader(val_ds_3d, batch_size=BATCH_SIZE_3D, shuffle=False, num_workers=NUM_WORKERS)
        test_loader_3d = DataLoader(test_ds_3d, batch_size=BATCH_SIZE_3D, shuffle=False, num_workers=NUM_WORKERS)
        
        # Initialize Simple3DCNN (Master Prompt specification)
        model_3d = Simple3DCNN()
        model_3d = train_model(model_3d, train_loader_3d, val_loader_3d, model_name="Simple3DCNN")
        
        # Save 3D model
        torch.save(model_3d.state_dict(), 'binary_ad_classifier.pth')
        print("Saved 3D CNN model as 'binary_ad_classifier.pth'")
        
        evaluate_model(model_3d, test_loader_3d, model_name="Simple3DCNN")
        
        print("\nTraining and evaluation complete. (Simple3DCNN - Master Prompt)")
        
        
    except Exception as e:
        logger.critical(f"Critical failure in main execution: {e}", exc_info=True)

if __name__ == '__main__':
    main()
