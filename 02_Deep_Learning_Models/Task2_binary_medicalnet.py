"""
Binary Classifier with MedicalNet Transfer Learning
====================================================
Uses pre-trained MedicalNet 3D ResNet for CN vs AD classification.
Designed for small datasets like ADNI through transfer learning.
"""

import os
import logging
import numpy as np
import pandas as pd
from tqdm import tqdm
import nibabel as nib
import pickle
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from sklearn.metrics import accuracy_score, roc_auc_score, f1_score, precision_score, recall_score, confusion_matrix
import matplotlib.pyplot as plt

# Import our MedicalNet model
from medicalnet import get_binary_model

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# =============================================================================
# CONFIGURATION
# =============================================================================
BATCH_SIZE = 2  # Smaller for MedicalNet (larger model)
NUM_EPOCHS = 30  # More epochs for fine-tuning
LEARNING_RATE = 1e-4
WEIGHT_DECAY = 1e-5
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
NUM_WORKERS = 0

# Paths
PRETRAINED_WEIGHTS = os.path.join("models", "pretrained", "resnet_10_23dataset.pth")
MODEL_SAVE_PATH = "binary_medicalnet_classifier.pth"

# =============================================================================
# DATASET
# =============================================================================
class MRIDataset3D(Dataset):
    """Dataset for 3D MRI volumes (NIfTI format)."""
    
    def __init__(self, metadata_df):
        self.metadata = metadata_df
        
    def __len__(self):
        return len(self.metadata)
    
    def __getitem__(self, idx):
        row = self.metadata.iloc[idx]
        img_path = row['path']
        label = int(float(row['label']))
        
        try:
            if not os.path.exists(img_path):
                raise FileNotFoundError(f"Image not found: {img_path}")
            
            img = nib.load(img_path)
            img_np = img.get_fdata().astype(np.float32)
            
            # Normalize to [0, 1]
            img_min, img_max = img_np.min(), img_np.max()
            if img_max > img_min:
                img_np = (img_np - img_min) / (img_max - img_min)
            
            # Add channel dimension: (1, D, H, W)
            img_tensor = torch.tensor(img_np, dtype=torch.float32).unsqueeze(0)
            
            return img_tensor, torch.tensor(label, dtype=torch.long)
            
        except Exception as e:
            logger.error(f"Error loading {img_path}: {e}")
            return torch.zeros((1, 128, 128, 128)), torch.tensor(label, dtype=torch.long)


def filter_and_remap(df):
    """Filter for CN (0) and AD (2), remap AD to 1."""
    df_binary = df[df['label'].isin([0, 2])].copy()
    df_binary['label'] = df_binary['label'].map({0: 0, 2: 1})
    return df_binary


# =============================================================================
# TRAINING
# =============================================================================
def train_model(model, train_loader, val_loader, model_name="MedicalNet_Binary"):
    """Training loop with early stopping and learning rate scheduling."""
    
    model = model.to(DEVICE)
    
    criterion = nn.CrossEntropyLoss()
    
    # Only optimize trainable parameters (FC layer if backbone is frozen)
    trainable_params = filter(lambda p: p.requires_grad, model.parameters())
    optimizer = optim.AdamW(trainable_params, lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
    
    # Learning rate scheduler: reduce on plateau
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode='min', factor=0.5, patience=3, verbose=True
    )
    
    train_losses, val_losses = [], []
    train_accs, val_accs = [], []
    
    best_val_acc = 0.0
    patience_counter = 0
    early_stopping_patience = 7
    
    print(f"\n{'='*60}")
    print(f"Starting MedicalNet Training on {DEVICE}")
    print(f"Trainable params: {sum(p.numel() for p in model.parameters() if p.requires_grad):,}")
    print(f"Total params: {sum(p.numel() for p in model.parameters()):,}")
    print(f"{'='*60}\n")
    
    for epoch in range(NUM_EPOCHS):
        # Training Phase
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        loop = tqdm(train_loader, desc=f"Epoch {epoch+1}/{NUM_EPOCHS} [Train]", leave=False)
        for images, labels in loop:
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
                images, labels = images.to(DEVICE), labels.to(DEVICE)
                outputs = model(images)
                loss = criterion(outputs, labels)
                
                val_running_loss += loss.item() * images.size(0)
                _, predicted = torch.max(outputs, 1)
                val_total += labels.size(0)
                val_correct += (predicted == labels).sum().item()
        
        val_loss = val_running_loss / val_total if val_total > 0 else 0
        val_acc = val_correct / val_total if val_total > 0 else 0
        val_losses.append(val_loss)
        val_accs.append(val_acc)
        
        # Learning rate scheduling
        scheduler.step(val_loss)
        
        print(f"Epoch {epoch+1}: Train Loss={epoch_loss:.4f}, Train Acc={epoch_acc:.4f}, "
              f"Val Loss={val_loss:.4f}, Val Acc={val_acc:.4f}")
        
        # Early stopping check
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            patience_counter = 0
            # Save best model
            torch.save(model.state_dict(), MODEL_SAVE_PATH)
            print(f"  -> New best! Saved to {MODEL_SAVE_PATH}")
        else:
            patience_counter += 1
            if patience_counter >= early_stopping_patience:
                print(f"\nEarly stopping triggered at epoch {epoch+1}!")
                break
    
    # Plot training curves
    plt.figure(figsize=(12, 5))
    
    plt.subplot(1, 2, 1)
    plt.plot(train_losses, label='Train Loss')
    plt.plot(val_losses, label='Val Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()
    plt.title(f'{model_name} Loss')
    
    plt.subplot(1, 2, 2)
    plt.plot(train_accs, label='Train Acc')
    plt.plot(val_accs, label='Val Acc')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend()
    plt.title(f'{model_name} Accuracy')
    
    plt.tight_layout()
    plt.savefig(f'{model_name}_training_curves.png', dpi=150)
    plt.close()
    
    print(f"\nTraining complete! Best validation accuracy: {best_val_acc:.4f}")
    return model


def evaluate_model(model, test_loader, model_name="MedicalNet_Binary"):
    """Evaluate model on test set and compute metrics."""
    
    model.eval()
    all_preds = []
    all_labels = []
    all_probs = []
    
    with torch.no_grad():
        for images, labels in tqdm(test_loader, desc="Evaluating"):
            images = images.to(DEVICE)
            outputs = model(images)
            probs = torch.softmax(outputs, dim=1)
            _, predicted = torch.max(outputs, 1)
            
            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(labels.numpy())
            all_probs.extend(probs[:, 1].cpu().numpy())
    
    # Compute metrics
    accuracy = accuracy_score(all_labels, all_preds)
    precision = precision_score(all_labels, all_preds, zero_division=0)
    recall = recall_score(all_labels, all_preds, zero_division=0)
    f1 = f1_score(all_labels, all_preds, zero_division=0)
    
    try:
        auc = roc_auc_score(all_labels, all_probs)
    except:
        auc = 0.0
    
    cm = confusion_matrix(all_labels, all_preds)
    
    print(f"\n{'='*60}")
    print(f"MedicalNet Binary Classification Results")
    print(f"{'='*60}")
    print(f"Accuracy:  {accuracy:.4f} ({accuracy*100:.2f}%)")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print(f"AUC-ROC:   {auc:.4f}")
    print(f"\nConfusion Matrix:")
    print(f"              Predicted CN  Predicted AD")
    print(f"Actual CN     {cm[0][0]:^12}  {cm[0][1]:^12}")
    print(f"Actual AD     {cm[1][0]:^12}  {cm[1][1]:^12}")
    print(f"{'='*60}\n")
    
    # Save results
    results = {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1': f1,
        'auc': auc,
        'confusion_matrix': cm,
        'predictions': all_preds,
        'labels': all_labels,
        'probabilities': all_probs
    }
    
    with open('binary_medicalnet_results.pkl', 'wb') as f:
        pickle.dump(results, f)
    
    return results


# =============================================================================
# MAIN
# =============================================================================
def main():
    print("\n" + "="*60)
    print("MedicalNet Binary Classifier (CN vs AD)")
    print("Transfer Learning with Pre-trained 3D ResNet")
    print("="*60)
    
    # Load metadata
    train_df = pd.read_csv('train.csv')
    val_df = pd.read_csv('val.csv')
    test_df = pd.read_csv('test.csv')
    
    # Filter and remap for binary classification
    train_df = filter_and_remap(train_df)
    val_df = filter_and_remap(val_df)
    test_df = filter_and_remap(test_df)
    
    print(f"\nDataset sizes:")
    print(f"  Train: {len(train_df)} samples")
    print(f"  Val:   {len(val_df)} samples")
    print(f"  Test:  {len(test_df)} samples")
    
    # Create datasets and loaders
    train_dataset = MRIDataset3D(train_df)
    val_dataset = MRIDataset3D(val_df)
    test_dataset = MRIDataset3D(test_df)
    
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=NUM_WORKERS)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=NUM_WORKERS)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=NUM_WORKERS)
    
    # Create model
    pretrained_path = PRETRAINED_WEIGHTS if os.path.exists(PRETRAINED_WEIGHTS) else None
    model = get_binary_model(pretrained_path=pretrained_path, freeze_backbone=True)
    
    # Train
    model = train_model(model, train_loader, val_loader)
    
    # Evaluate
    # Load best model
    model.load_state_dict(torch.load(MODEL_SAVE_PATH, map_location=DEVICE))
    model = model.to(DEVICE)
    
    results = evaluate_model(model, test_loader)
    
    print("\nDone! Results saved to 'binary_medicalnet_results.pkl'")
    return results


if __name__ == "__main__":
    main()
