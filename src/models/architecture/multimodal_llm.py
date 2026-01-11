import torch
import torch.nn as nn
from transformers import AutoModelForCausalLM, AutoTokenizer
from .grid_encoder import GridViT
from .projector import MultimodalProjector

class MultimodalLLM(nn.Module):
    """
    The main Hybrid Model Class.
    Combines:
    1. GridViT (Custom Encoder)
    2. MultimodalProjector (Adaptor)
    3. Frozen LLM (DeepSeek/Qwen)
    """
    def __init__(self, 
                 llm_model_path="deepseek-ai/deepseek-llm-7b-chat", 
                 visual_feature_dim=768,
                 freeze_llm=True,
                 load_in_4bit=False):
        super().__init__()
        
        print(f"Loading LLM from {llm_model_path}...")
        # In a real implementation, would use quantization config here
        self.llm = AutoModelForCausalLM.from_pretrained(
            llm_model_path, 
            trust_remote_code=True,
            device_map="auto" if torch.cuda.is_available() else "cpu"
        )
        self.tokenizer = AutoTokenizer.from_pretrained(llm_model_path, trust_remote_code=True)
        
        if freeze_llm:
            print("Freezing LLM parameters...")
            for param in self.llm.parameters():
                param.requires_grad = False
        
        self.llm_hidden_dim = self.llm.config.hidden_size
        
        print("Initializing GridViT and Projector...")
        self.grid_encoder = GridViT(feature_dim=visual_feature_dim)
        self.projector = MultimodalProjector(visual_input_dim=visual_feature_dim, 
                                             llm_hidden_dim=self.llm_hidden_dim)
        
    def forward(self, grid_images, input_ids, attention_mask=None, labels=None):
        """
        Args:
            grid_images: (B, 10, C, H, W)
            input_ids: (B, Seq_Len) - Text tokens
            attention_mask: (B, Seq_Len)
            labels: (B, Seq_Len) - For training
        """
        # 1. Encode Images
        # (B, 10, visual_dim)
        visual_features = self.grid_encoder(grid_images)
        
        # 2. Project to LLM space
        # (B, 10, llm_dim)
        visual_tokens = self.projector(visual_features)
        
        # 3. Embed Text
        # (B, Seq_Len, llm_dim)
        inputs_embeds = self.llm.get_input_embeddings()(input_ids)
        
        # 4. Concatenate (Simplified: Prepend visual tokens to text)
        # In a real LLaVA implementation, we would insert at <image> token position
        # For this prototype, we just prepend
        combined_embeds = torch.cat([visual_tokens, inputs_embeds], dim=1)
        
        # adjust attention mask
        if attention_mask is not None:
            batch_size = attention_mask.shape[0]
            visual_mask = torch.ones((batch_size, visual_tokens.shape[1]), 
                                     device=attention_mask.device, 
                                     dtype=attention_mask.dtype)
            combined_mask = torch.cat([visual_mask, attention_mask], dim=1)
        else:
            combined_mask = None

        # adjust labels (ignore visual tokens for loss)
        if labels is not None:
            visual_labels = torch.full((labels.shape[0], visual_tokens.shape[1]), 
                                       -100, 
                                       device=labels.device, 
                                       dtype=labels.dtype)
            combined_labels = torch.cat([visual_labels, labels], dim=1)
        else:
            combined_labels = None
            
        # 5. Forward through LLM
        outputs = self.llm(
            inputs_embeds=combined_embeds,
            attention_mask=combined_mask,
            labels=combined_labels,
            return_dict=True
        )
        
        return outputs
        
    def generate(self, grid_images, prompt_text, max_new_tokens=100):
        """
        Inference method
        """
        # 1. Encode
        visual_features = self.grid_encoder(grid_images)
        visual_tokens = self.projector(visual_features)
        
        # 2. Tokenize prompt
        inputs = self.tokenizer(prompt_text, return_tensors="pt").to(grid_images.device)
        input_ids = inputs.input_ids
        
        # 3. Embed text
        inputs_embeds = self.llm.get_input_embeddings()(input_ids)
        
        # 4. Concat
        combined_embeds = torch.cat([visual_tokens, inputs_embeds], dim=1)
        
        # 5. Generate (using LLM's generate but passing inputs_embeds)
        # Note: Standard HF generate() might not support inputs_embeds easily without hooks
        # This is a simplified view. Often we need to craft a custom generation loop 
        # or use specific model support for inputs_embeds in generate.
        
        # For prototype, we might rely on the model supporting inputs_embeds in generate 
        # (some do, some don't). If not, we iterate step by step.
        
        outputs = self.llm.generate(
            inputs_embeds=combined_embeds,
            max_new_tokens=max_new_tokens
        )
        
        decoded = self.tokenizer.batch_decode(outputs, skip_special_tokens=True)
        return decoded
