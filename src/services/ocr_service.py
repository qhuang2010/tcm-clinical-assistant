"""OCR service for prescription image recognition.

Uses Vision LLM (Kimi/Claude/GPT-4o) to read handwritten prescriptions.
Falls back to RapidOCR for printed text, mock data as last resort.
"""

import base64
import io
import json
import os
import logging
import requests

logger = logging.getLogger(__name__)

# Vision model mapping per provider
_VISION_MODELS = {
    "kimi": "kimi-k2.5",
    "moonshot": "kimi-k2.5",
    "anthropic": None,  # Claude uses same model for vision
    "openai": "gpt-4o",
}

_SYSTEM_PROMPT = """你是一位中医处方识别专家。请仔细识别这张手写处方图片中的患者基本信息。
注意：只需要识别患者信息部分，不需要识别药物处方内容。

处方通常在顶部有患者信息栏，包含姓名、性别、年龄、日期、诊断等字段。
请仔细辨认手写字迹，尽力识别这些字段的值。

请严格按以下 JSON 格式返回，不要输出任何其他文字：
{
  "patient_info": {
    "name": "患者姓名",
    "gender": "性别",
    "age": "年龄",
    "date": "就诊日期",
    "diagnosis": "诊断/主诉"
  }
}

注意：
- 手写字迹可能潦草，请尽力识别
- 如果某个字段无法识别，填写空字符串""
- 只返回患者信息，不要返回药物"""


class OCRService:
    def __init__(self):
        self._api_key = os.getenv("LLM_API_KEY", "").strip()
        self._api_url = os.getenv("LLM_API_URL", "")
        self._provider = os.getenv("LLM_PROVIDER", "openai").lower()
        self._model = os.getenv("LLM_MODEL", "")
        self._rapid = None
        try:
            from rapidocr_onnxruntime import RapidOCR
            self._rapid = RapidOCR()
        except ImportError:
            pass

    def detect_regions(self, image_bytes: bytes) -> dict:
        """Main entry: try Vision LLM first, fall back to RapidOCR, then mock."""
        from PIL import Image
        img = Image.open(io.BytesIO(image_bytes))
        w, h = img.size

        # Try Vision LLM
        if self._api_key:
            try:
                llm_result = self._call_vision_llm(image_bytes)
                if llm_result:
                    return {**llm_result, "image_width": w, "image_height": h, "method": "llm"}
            except Exception as e:
                logger.warning(f"Vision LLM failed, falling back: {e}")
                print(f"[OCR] Vision LLM error: {e}")
                # Fall through to RapidOCR instead of returning error

        # Fallback: RapidOCR
        if self._rapid:
            result = self._detect_rapid(image_bytes, w, h)
            result["method"] = "rapid"
            return result

        result = self._mock_regions()
        result["method"] = "mock"
        return result

    def _call_vision_llm(self, image_bytes: bytes) -> dict | None:
        """Call Vision LLM to recognize handwritten prescription."""
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        media_type = "image/jpeg"

        vision_model = (
            os.getenv("LLM_VISION_MODEL")
            or _VISION_MODELS.get(self._provider)
            or self._model
        )
        print(f"[OCR] Using vision model: {vision_model}, provider: {self._provider}")

        if self._provider == "anthropic":
            return self._call_anthropic_vision(b64, media_type, vision_model)

        # OpenAI-compatible API (Kimi, GPT-4o, etc.)
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": vision_model,
            "messages": [
                {"role": "user", "content": [
                    {"type": "text", "text": _SYSTEM_PROMPT + "\n\n请识别这张处方图片中的患者信息。"},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{media_type};base64,{b64}"
                        },
                    },
                ]},
            ],
        }

        resp = requests.post(
            self._api_url, headers=headers, json=payload, timeout=90
        )
        if resp.status_code != 200:
            error_body = resp.text[:500]
            print(f"[OCR] API error {resp.status_code}: {error_body}")
            raise Exception(f"{resp.status_code}: {error_body}")
        text = resp.json()["choices"][0]["message"]["content"]
        print(f"[OCR] LLM response: {text[:500]}")
        return self._parse_llm_response(text)

    def _call_anthropic_vision(self, b64: str, media_type: str, model: str) -> dict | None:
        from anthropic import Anthropic
        client = Anthropic(api_key=self._api_key)
        msg = client.messages.create(
            model=model,
            max_tokens=4096,
            system=_SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": b64,
                        },
                    },
                    {"type": "text", "text": "请识别这张处方图片的内容。"},
                ],
            }],
        )
        return self._parse_llm_response(msg.content[0].text)

    @staticmethod
    def _parse_llm_response(text: str) -> dict | None:
        """Extract JSON from LLM response text."""
        # Try to find JSON block
        text = text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            # Try to find { ... } in the text
            start = text.find("{")
            end = text.rfind("}") + 1
            if start >= 0 and end > start:
                data = json.loads(text[start:end])
            else:
                return None

        # Convert to patient_info format for frontend
        patient = data.get("patient_info", {})
        info = {}
        for field in ["name", "gender", "age", "date", "diagnosis"]:
            val = patient.get(field, "")
            if val:
                info[field] = val

        return {"patient_info": info, "llm": True}

    def _detect_rapid(self, image_bytes: bytes, w: int, h: int) -> dict:
        """Fallback: use RapidOCR for printed text in patient info area."""
        import numpy as np
        from PIL import Image
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        result, _ = self._rapid(np.array(img))
        # Best-effort: return raw text, frontend will show as-is
        info = {}
        full_lines = []
        if result:
            texts = [text.strip() for _, text, _ in result if text.strip()]
            full_lines = texts
            # Try to find common patterns
            for i, t in enumerate(texts):
                if "姓名" in t:
                    val = t.split("：")[-1].split(":")[-1].strip()
                    # Only use next line if it doesn't look like another label
                    if not val and i + 1 < len(texts) and "：" not in texts[i + 1] and ":" not in texts[i + 1]:
                        val = texts[i + 1].strip()
                    if val:
                        info["name"] = val
                elif "性别" in t:
                    val = t.split("：")[-1].split(":")[-1].strip()
                    if not val and i + 1 < len(texts) and "：" not in texts[i + 1] and ":" not in texts[i + 1]:
                        val = texts[i + 1].strip()
                    if val:
                        info["gender"] = val
                elif "年龄" in t:
                    val = t.split("：")[-1].split(":")[-1].strip()
                    if not val and i + 1 < len(texts) and "：" not in texts[i + 1] and ":" not in texts[i + 1]:
                        val = texts[i + 1].strip()
                    if val:
                        info["age"] = val
                elif "诊断" in t:
                    val = t.split("：")[-1].split(":")[-1].strip()
                    if not val and i + 1 < len(texts) and "：" not in texts[i + 1] and ":" not in texts[i + 1]:
                        val = texts[i + 1].strip()
                    if val:
                        info["diagnosis"] = val
        return {
            "patient_info": info,
            "full_text": "\n".join(full_lines),
            "image_width": w,
            "image_height": h,
        }

    @staticmethod
    def _mock_regions() -> dict:
        return {
            "patient_info": {
                "name": "张三", "gender": "男", "age": "45",
                "date": "2025-03-05", "diagnosis": "头痛眩晕",
            },
            "mock": True,
        }
