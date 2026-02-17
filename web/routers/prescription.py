import json
import os
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from src.database.connection import get_db
from src.database.models import User
from src.services import auth_service
from src.services.ocr_service import OCRService

router = APIRouter(
    prefix="/api/prescription",
    tags=["prescription"]
)

ocr_service = OCRService()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp", "image/*", "application/octet-stream"}
MAX_SIZE = 10 * 1024 * 1024  # 10 MB

# Directory for saving annotation training data
ANNOTATION_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "data", "annotations",
)


@router.post("/recognize")
async def recognize_prescription(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_active_user),
):
    """Detect text regions with bounding boxes from prescription image."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="仅支持 JPEG、PNG、WebP、BMP 格式的图片",
        )

    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="图片大小不能超过 10MB")

    try:
        result = ocr_service.detect_regions(contents)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"识别失败: {str(e)}")


@router.post("/save-annotation")
async def save_annotation(
    file: UploadFile = File(...),
    annotations: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_active_user),
):
    """Save image + human-corrected annotations for future training."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="仅支持图片格式")

    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="图片大小不能超过 10MB")

    try:
        annotation_data = json.loads(annotations)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="标注数据格式错误")

    try:
        os.makedirs(ANNOTATION_DIR, exist_ok=True)
        file_id = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
        ext = os.path.splitext(file.filename or "img.jpg")[1] or ".jpg"

        img_path = os.path.join(ANNOTATION_DIR, f"{file_id}{ext}")
        with open(img_path, "wb") as f:
            f.write(contents)

        meta = {
            "file_id": file_id,
            "image_file": f"{file_id}{ext}",
            "user_id": current_user.id,
            "username": current_user.username,
            "created_at": datetime.now().isoformat(),
            "regions": annotation_data,
        }
        json_path = os.path.join(ANNOTATION_DIR, f"{file_id}.json")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)

        return {"message": "标注数据已保存", "file_id": file_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"保存失败: {str(e)}")
