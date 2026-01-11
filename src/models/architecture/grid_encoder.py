import torch
import torch.nn as nn
import torchvision.models as models

class GridViT(nn.Module):
    """
    Grid-Aware Vision Transformer (GridViT) for TCM Pulse Diagnosis.
    
    This encoder is designed to process the 9-grid pulse image.
    Instead of standard random patching, it treats each of the 9 grid regions
    (Cun/Guan/Chi x Fu/Zhong/Chen) as a distinct semantic visual token,
    plus a global token.
    """
    def __init__(self, feature_dim=768, pretrained=True):
        super().__init__()
        
        # We use a lightweight ResNet as the feature extractor for each grid patch
        # In a full implementation, this could be a ViT patch embedding layer
        self.backbone = models.resnet18(weights=models.ResNet18_Weights.DEFAULT if pretrained else None)
        self.backbone_dim = 512
        # Remove the fc layer
        self.backbone = nn.Sequential(*list(self.backbone.children())[:-1])
        
        # Comparison with standard ViT:
        # Standard ViT: Image -> N patches -> N embeddings
        # GridViT: 9 Grid Images -> 9 embeddings + 1 Global Image -> 1 embedding
        
        self.projection = nn.Linear(self.backbone_dim, feature_dim)
        
        # Spatial Learnable Embeddings for the 9 TCM positions + 1 Global
        # 0: Global, 1-3: Cun (F/Z/C), 4-6: Guan, 7-9: Chi
        self.position_embeddings = nn.Parameter(torch.randn(1, 10, feature_dim))
        
        # A small Transformer Encoder to let grid regions interact
        # e.g. "Rootless Yang" requires interaction between Cun-Fu and Chi-Chen
        encoder_layer = nn.TransformerEncoderLayer(d_model=feature_dim, nhead=4, batch_first=True)
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=2)
        
    def forward(self, grid_images):
        """
        Args:
            grid_images: Tensor of shape (B, 10, C, H, W)
                         Index 0 is the full global image
                         Indices 1-9 are the 9 grid crops
        Returns:
            visual_embeds: (B, 10, feature_dim)
        """
        batch_size = grid_images.shape[0]
        num_patches = grid_images.shape[1]
        
        # Flatten batch and patches to pass through backbone
        # (B * 10, C, H, W)
        flat_images = grid_images.view(-1, *grid_images.shape[2:])
        
        # Extract features
        # (B * 10, 512, 1, 1) -> (B * 10, 512)
        features = self.backbone(flat_images).squeeze()
        
        # Project to target dimension
        features = self.projection(features)
        
        # Reshape back to sequence
        # (B, 10, feature_dim)
        features = features.view(batch_size, num_patches, -1)
        
        # Add spatial embeddings
        features = features + self.position_embeddings
        
        # Apply Transformer interaction
        visual_embeds = self.transformer(features)
        
        return visual_embeds
