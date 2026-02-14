
import os
import sys
import logging
from dotenv import load_dotenv

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.services.llm_service import llm_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_kimi_connection():
    print("Testing Kimi (Moonshot AI) Connection...")
    print(f"Provider (compatibility): {llm_service.provider}")
    print(f"Model: {llm_service.model}")
    print(f"API URL: {llm_service.api_url}")
    
    if not llm_service.api_key:
        print("\nERROR: LLM_API_KEY is not set in .env. Please set your Moonshot AI API Key to proceed.")
        return False

    try:
        response = llm_service._call_llm(
            "You are Kimi, a helpful AI assistant created by Moonshot AI.", 
            "Hello! Please tell me in Chinese who created you."
        )
        print(f"\nResponse from Kimi:\n{response}")
        return True
    except Exception as e:
        print(f"\nError connecting to Kimi: {e}")
        return False

if __name__ == "__main__":
    load_dotenv()
    # Re-init service to pick up env vars if needed
    from src.services.llm_service import LLMService
    global llm_service
    llm_service = LLMService()
    
    test_kimi_connection()
