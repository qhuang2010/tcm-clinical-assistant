"""Standalone OCR worker script — runs under Python 3.12 with PaddleOCR.

Usage: C:/Python312/python.exe ocr_worker.py <image_path>
Outputs JSON to stdout.
"""
import json
import os
import sys

os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"


def run_ocr(image_path: str) -> dict:
    from paddleocr import PaddleOCR
    from PIL import Image
    import numpy as np

    img = Image.open(image_path).convert("RGB")
    w, h = img.size
    img_array = np.array(img)

    ocr = PaddleOCR(lang="ch")
    results = ocr.predict(img_array)

    regions = []
    idx = 0
    for res in results:
        # PaddleOCR 3.x result object attributes
        polys = getattr(res, "dt_polys", [])
        texts = getattr(res, "rec_texts", [])
        scores = getattr(res, "rec_scores", [])

        for i in range(len(texts)):
            text = texts[i] if i < len(texts) else ""
            score = float(scores[i]) if i < len(scores) else 0.0
            if not text.strip():
                continue

            # Convert polygon to axis-aligned bbox
            if i < len(polys):
                poly = polys[i]
                xs = [float(p[0]) for p in poly]
                ys = [float(p[1]) for p in poly]
                bbox = [int(min(xs)), int(min(ys)), int(max(xs)), int(max(ys))]
            else:
                bbox = [0, 0, 100, 30]

            category = classify_region(text.strip())
            regions.append({
                "id": idx,
                "bbox": bbox,
                "text": text.strip(),
                "confidence": round(score, 3),
                "category": category,
            })
            idx += 1

    return {"regions": regions, "image_width": w, "image_height": h}


def classify_region(text: str) -> str:
    info_keywords = [
        "姓名", "性别", "年龄", "岁", "男", "女",
        "日期", "年", "月", "日", "科别", "门诊", "住院",
        "诊断", "主诉", "病历", "处方", "医师", "药师",
    ]
    for kw in info_keywords:
        if kw in text:
            return "info"
    if len(text) <= 4 and any(c.isdigit() for c in text):
        return "info"
    return "medicine"


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: ocr_worker.py <image_path>"}))
        sys.exit(1)

    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(json.dumps({"error": f"File not found: {image_path}"}))
        sys.exit(1)

    try:
        result = run_ocr(image_path)
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False))
        sys.exit(1)
