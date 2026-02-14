
import pytest
from unittest.mock import patch, MagicMock
from src.services.llm_service import LLMService

@pytest.fixture
def mock_llm_service():
    service = LLMService()
    service.api_key = "test_key"
    service.provider = "anthropic"
    return service

@patch("anthropic.Anthropic")
def test_call_anthropic(mock_anthropic_class, mock_llm_service):
    # Setup mock client and response
    mock_client = MagicMock()
    mock_anthropic_class.return_value = mock_client
    
    # ... rest ...
    
    # ensure we are using the patched class
    # The code does `from anthropic import Anthropic` inside the function.
    # So patching `anthropic.Anthropic` should work.

    mock_message = MagicMock()
    mock_message.content = [MagicMock(text="Claude Response")]
    mock_client.messages.create.return_value = mock_message
    
    # Call the service
    response = mock_llm_service._call_anthropic("System Prompt", "User Prompt")
    
    # Assertions
    assert response == "Claude Response"
    mock_client.messages.create.assert_called_once()
    
    # Verify call args
    call_kwargs = mock_client.messages.create.call_args[1]
    assert call_kwargs["system"] == "System Prompt"
    assert call_kwargs["messages"][0]["content"] == "User Prompt"

@patch("anthropic.Anthropic")
def test_health_report(mock_anthropic_class, mock_llm_service):
    # Setup mock
    mock_client = MagicMock()
    mock_anthropic_class.return_value = mock_client
    
    mock_message = MagicMock()
    output_text = "Analysis: The pulse indicates dampness."
    mock_message.content = [MagicMock(text=output_text)]
    mock_client.messages.create.return_value = mock_message
    
    data = {"pulse_grid": {"left-guan-zhong": "Slippery"}}
    
    report = mock_llm_service.generate_health_report(data)
    
    assert output_text in report
    
@patch("requests.post")
def test_openai_fallback(mock_post, mock_llm_service):
    # Test OpenAI fallback - ensure we patch where it is used or globally
    # llm_service imports requests. So patch requests.post
    mock_llm_service.provider = "openai"

    
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "choices": [{"message": {"content": "GPT Response"}}]
    }
    mock_post.return_value = mock_response
    
    response = mock_llm_service._call_llm("Sys", "User")
    assert response == "GPT Response"
