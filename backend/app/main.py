from __future__ import annotations

import json
import os
import shutil
import tempfile
import uuid
import zipfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Annotated

import albumentations as A
import cv2
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, ValidationError
from starlette.background import BackgroundTask

app = FastAPI(title="AI Data Augmentation API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_IMAGES = 10
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}


class AugmentationConfig(BaseModel):
    horizontal_flip: bool = True
    rotation: int = Field(default=15, ge=0, le=45)
    brightness_contrast: bool = True
    gaussian_noise: bool = False
    blur: bool = False
    augmentations_per_image: int = Field(default=5, ge=1, le=30)
    test_split: float = Field(default=0.2, ge=0.0, le=0.8)


def _build_pipeline(config: AugmentationConfig) -> A.Compose:
    transforms: list[A.BasicTransform] = []

    if config.horizontal_flip:
        transforms.append(A.HorizontalFlip(p=0.7))
    if config.rotation > 0:
        transforms.append(A.Rotate(limit=(-config.rotation, config.rotation), p=0.8, border_mode=cv2.BORDER_REFLECT))
    if config.brightness_contrast:
        transforms.append(A.RandomBrightnessContrast(p=0.7))
    if config.gaussian_noise:
        transforms.append(A.GaussNoise(p=0.5))
    if config.blur:
        transforms.append(A.GaussianBlur(blur_limit=(3, 7), p=0.5))

    if not transforms:
        transforms = [A.NoOp()]

    return A.Compose(transforms)


def _to_cv_image(payload: bytes) -> np.ndarray:
    raw = np.frombuffer(payload, dtype=np.uint8)
    image = cv2.imdecode(raw, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Invalid image file")
    return image


def _save_image(path: Path, image: np.ndarray) -> None:
    ok = cv2.imwrite(str(path), image)
    if not ok:
        raise RuntimeError(f"Failed to write image to {path}")


def _augment_image_set(
    image_name: str,
    image_bytes: bytes,
    output_root: Path,
    pipeline: A.Compose,
    augment_count: int,
    test_split: float,
) -> None:
    image = _to_cv_image(image_bytes)
    stem = Path(image_name).stem
    ext = ".png"

    image_output_root = output_root / stem
    train_dir = image_output_root / "train"
    test_dir = image_output_root / "test"
    train_dir.mkdir(parents=True, exist_ok=True)
    test_dir.mkdir(parents=True, exist_ok=True)

    # Keep original in train by default.
    _save_image(train_dir / f"{stem}_original{ext}", image)

    test_threshold = int(round(augment_count * test_split))

    for idx in range(augment_count):
        augmented = pipeline(image=image)["image"]
        unique_suffix = uuid.uuid4().hex[:8]
        file_name = f"{stem}_aug_{idx + 1}_{unique_suffix}{ext}"

        destination = test_dir if idx < test_threshold else train_dir
        _save_image(destination / file_name, augmented)


def _zip_directory(source_dir: Path, zip_path: Path) -> None:
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for file_path in source_dir.rglob("*"):
            if file_path.is_file():
                archive.write(file_path, file_path.relative_to(source_dir))


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/augment")
async def augment(
    files: Annotated[list[UploadFile], File(...)],
    config: Annotated[str, Form(...)],
):
    if not files:
        raise HTTPException(status_code=400, detail="At least one image is required.")
    if len(files) > MAX_IMAGES:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_IMAGES} images allowed.")

    try:
        parsed_config = AugmentationConfig.model_validate(json.loads(config))
    except (ValidationError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=400, detail=f"Invalid config payload: {exc}") from exc

    pipeline = _build_pipeline(parsed_config)

    for file in files:
        extension = Path(file.filename or "").suffix.lower()
        if extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Unsupported file format: {file.filename}")

    temp_dir = Path(tempfile.mkdtemp(prefix="augmentation_"))
    output_root = temp_dir / "output"
    output_root.mkdir(parents=True, exist_ok=True)

    try:
        payloads = []
        for file in files:
            payloads.append((file.filename or "uploaded_image", await file.read()))

        with ThreadPoolExecutor(max_workers=min(os.cpu_count() or 1, 4)) as executor:
            futures = [
                executor.submit(
                    _augment_image_set,
                    image_name,
                    image_bytes,
                    output_root,
                    pipeline,
                    parsed_config.augmentations_per_image,
                    parsed_config.test_split,
                )
                for image_name, image_bytes in payloads
            ]
            for future in futures:
                future.result()

        zip_path = temp_dir / "augmented_dataset.zip"
        await run_in_threadpool(_zip_directory, output_root, zip_path)

        return FileResponse(
            path=zip_path,
            media_type="application/zip",
            filename="augmented_dataset.zip",
            background=BackgroundTask(lambda: shutil.rmtree(temp_dir, ignore_errors=True)),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Augmentation failed: {exc}") from exc
