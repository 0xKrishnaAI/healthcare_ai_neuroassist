"""
MedicalNet - Pre-trained 3D ResNet for Medical Image Analysis
Based on: https://github.com/Tencent/MedicalNet

This module provides a ResNet-10 architecture pre-trained on 23 medical imaging datasets.
Suitable for transfer learning on small medical imaging datasets like ADNI.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from functools import partial
import os


def conv3x3x3(in_planes, out_planes, stride=1):
    """3x3x3 convolution with padding"""
    return nn.Conv3d(
        in_planes,
        out_planes,
        kernel_size=3,
        stride=stride,
        padding=1,
        bias=False
    )


def downsample_basic_block(x, planes, stride):
    """Downsample block for residual connections"""
    out = F.avg_pool3d(x, kernel_size=1, stride=stride)
    zero_pads = torch.zeros(
        out.size(0), planes - out.size(1), out.size(2), out.size(3), out.size(4),
        device=out.device, dtype=out.dtype
    )
    out = torch.cat([out, zero_pads], dim=1)
    return out


class BasicBlock(nn.Module):
    """Basic residual block for ResNet-10/18"""
    expansion = 1

    def __init__(self, inplanes, planes, stride=1, downsample=None):
        super(BasicBlock, self).__init__()
        self.conv1 = conv3x3x3(inplanes, planes, stride)
        self.bn1 = nn.BatchNorm3d(planes)
        self.relu = nn.ReLU(inplace=True)
        self.conv2 = conv3x3x3(planes, planes)
        self.bn2 = nn.BatchNorm3d(planes)
        self.downsample = downsample
        self.stride = stride

    def forward(self, x):
        residual = x

        out = self.conv1(x)
        out = self.bn1(out)
        out = self.relu(out)

        out = self.conv2(out)
        out = self.bn2(out)

        if self.downsample is not None:
            residual = self.downsample(x)

        out += residual
        out = self.relu(out)

        return out


class ResNet(nn.Module):
    """
    3D ResNet for medical image classification.
    
    Args:
        block: Block type (BasicBlock for ResNet-10/18)
        layers: List of block counts per layer
        sample_input_D: Depth dimension of input
        sample_input_H: Height dimension of input
        sample_input_W: Width dimension of input
        num_seg_classes: Number of output classes
        shortcut_type: Type of shortcut connection ('A' or 'B')
    """

    def __init__(self,
                 block,
                 layers,
                 sample_input_D=128,
                 sample_input_H=128,
                 sample_input_W=128,
                 num_seg_classes=2,
                 shortcut_type='B'):
        
        self.inplanes = 64
        super(ResNet, self).__init__()
        
        # Initial convolution
        self.conv1 = nn.Conv3d(
            1, 64, kernel_size=7, stride=(2, 2, 2),
            padding=(3, 3, 3), bias=False
        )
        self.bn1 = nn.BatchNorm3d(64)
        self.relu = nn.ReLU(inplace=True)
        self.maxpool = nn.MaxPool3d(kernel_size=(3, 3, 3), stride=2, padding=1)
        
        # Residual layers
        self.layer1 = self._make_layer(block, 64, layers[0], shortcut_type)
        self.layer2 = self._make_layer(block, 128, layers[1], shortcut_type, stride=2)
        self.layer3 = self._make_layer(block, 256, layers[2], shortcut_type, stride=2)
        self.layer4 = self._make_layer(block, 512, layers[3], shortcut_type, stride=2)

        # Global average pooling
        self.avgpool = nn.AdaptiveAvgPool3d((1, 1, 1))
        
        # Classification head
        self.fc = nn.Linear(512 * block.expansion, num_seg_classes)

        # Initialize weights
        for m in self.modules():
            if isinstance(m, nn.Conv3d):
                nn.init.kaiming_normal_(m.weight, mode='fan_out', nonlinearity='relu')
            elif isinstance(m, nn.BatchNorm3d):
                nn.init.constant_(m.weight, 1)
                nn.init.constant_(m.bias, 0)

    def _make_layer(self, block, planes, blocks, shortcut_type, stride=1):
        downsample = None
        if stride != 1 or self.inplanes != planes * block.expansion:
            if shortcut_type == 'A':
                downsample = partial(
                    downsample_basic_block,
                    planes=planes * block.expansion,
                    stride=stride
                )
            else:
                downsample = nn.Sequential(
                    nn.Conv3d(
                        self.inplanes,
                        planes * block.expansion,
                        kernel_size=1,
                        stride=stride,
                        bias=False
                    ),
                    nn.BatchNorm3d(planes * block.expansion)
                )

        layers = []
        layers.append(block(self.inplanes, planes, stride, downsample))
        self.inplanes = planes * block.expansion
        for _ in range(1, blocks):
            layers.append(block(self.inplanes, planes))

        return nn.Sequential(*layers)

    def forward(self, x):
        x = self.conv1(x)
        x = self.bn1(x)
        x = self.relu(x)
        x = self.maxpool(x)

        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)

        x = self.avgpool(x)
        x = x.view(x.size(0), -1)
        x = self.fc(x)

        return x


def resnet10(**kwargs):
    """Constructs a ResNet-10 model."""
    model = ResNet(BasicBlock, [1, 1, 1, 1], **kwargs)
    return model


def resnet18(**kwargs):
    """Constructs a ResNet-18 model."""
    model = ResNet(BasicBlock, [2, 2, 2, 2], **kwargs)
    return model


def generate_medicalnet_model(num_classes, pretrained_path=None, freeze_backbone=True):
    """
    Generate a MedicalNet model for classification.
    
    Args:
        num_classes: Number of output classes
        pretrained_path: Path to pre-trained weights (optional)
        freeze_backbone: Whether to freeze backbone layers (default: True)
    
    Returns:
        model: PyTorch model ready for training
    """
    # Create ResNet-10 model
    model = resnet10(
        sample_input_D=128,
        sample_input_H=128,
        sample_input_W=128,
        num_seg_classes=num_classes,
        shortcut_type='B'
    )
    
    # Load pre-trained weights if available
    if pretrained_path and os.path.exists(pretrained_path):
        print(f"[INFO] Loading pre-trained weights from: {pretrained_path}")
        checkpoint = torch.load(pretrained_path, map_location='cpu')
        
        # Handle different checkpoint formats
        if 'state_dict' in checkpoint:
            state_dict = checkpoint['state_dict']
        else:
            state_dict = checkpoint
        
        # Load weights (strict=False to allow missing/extra keys)
        model.load_state_dict(state_dict, strict=False)
        print("[INFO] Pre-trained weights loaded successfully!")
    else:
        print("[WARN] No pre-trained weights found. Using random initialization.")
        print("       For best results, download MedicalNet weights from:")
        print("       https://www.kaggle.com/datasets/solomonk/medicalnet")
    
    # Freeze backbone if specified
    if freeze_backbone and pretrained_path:
        print("[INFO] Freezing backbone layers (only FC will be trained)")
        for name, param in model.named_parameters():
            if 'fc' not in name:
                param.requires_grad = False
    
    # Replace final FC layer for our classification task
    in_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(0.5),
        nn.Linear(in_features, 256),
        nn.ReLU(inplace=True),
        nn.Dropout(0.3),
        nn.Linear(256, num_classes)
    )
    
    return model


# -----------------------------------------------------------------------------
# CONVENIENCE FUNCTIONS
# -----------------------------------------------------------------------------

def get_binary_model(pretrained_path=None, freeze_backbone=True):
    """Get MedicalNet model for binary classification (CN vs AD)"""
    return generate_medicalnet_model(2, pretrained_path, freeze_backbone)


def get_multiclass_model(pretrained_path=None, freeze_backbone=True):
    """Get MedicalNet model for multi-class classification (CN vs MCI vs AD)"""
    return generate_medicalnet_model(3, pretrained_path, freeze_backbone)


if __name__ == "__main__":
    # Test model creation
    print("Testing MedicalNet model creation...")
    
    model = get_binary_model()
    print(f"Binary model created: {sum(p.numel() for p in model.parameters())} parameters")
    
    # Test forward pass
    x = torch.randn(1, 1, 128, 128, 128)
    with torch.no_grad():
        out = model(x)
    print(f"Output shape: {out.shape}")
    print("Test passed!")
