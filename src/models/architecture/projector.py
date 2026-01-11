import torch
import torch.nn as nn

class MultimodalProjector(nn.Module):
    """
    Projector to bridge the Visual Encoder output to the LLM's Text Embedding space.
    Simple MLP approach as used in LLaVA-1.5.
    """
    def __init__(self, visual_input_dim, llm_hidden_dim):
        super().__init__()
        
        self.mlp = nn.Sequential(
            nn.Linear(visual_input_dim, llm_hidden_dim),
            nn.GELU(),
            nn.Linear(llm_hidden_dim, llm_hidden_dim)
        )
        
    def forward(self, visual_embeds):
        """
        Args:
            visual_embeds: (B, Seq_Len, visual_dim)
        Returns:
            projected_embeds: (B, Seq_Len, llm_dim)
        """
        return self.mlp(visual_embeds)
