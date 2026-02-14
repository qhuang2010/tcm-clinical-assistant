
# Kimi (Moonshot AI) Integration Setup

You have configured the system to use **Kimi (Moonshot AI)** as your LLM provider for TCM analysis.

## Configuration Details

Your `.env` file has been automatically updated with the Kimi API endpoint:

```ini
LLM_PROVIDER=openai  # Uses OpenAI-compatible API format
LLM_API_URL=https://api.moonshot.cn/v1/chat/completions
LLM_API_KEY=YOUR_API_KEY_HERE
LLM_MODEL=moonshot-v1-8k
```

## Next Steps

1.  **Get your API Key**:
    -   Go to [Moonshot AI Platform](https://platform.moonshot.cn/)
    -   Sign up/Login and create an API Key.

2.  **Update `.env`**:
    -   Open `h:\mysoft\chinamed\.env`
    -   Paste your key after `LLM_API_KEY=`.

3.  **Test Connection**:
    -   Run the provided test script:
        ```bash
        python scripts/test_kimi.py
        ```
    -   If successful, you will see a response from Kimi.

## Usage in App

Once configured, the following features will automatically use Kimi:
-   **Pulse Analysis**: Generates TCM tongue/pulse reports.
-   **Health Chat**: Chat with your medical history using Kimi.
-   **Trend Analysis**: Analyze health trends over time.
