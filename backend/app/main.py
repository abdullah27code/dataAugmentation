from __future__ import annotations

import base64
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
    vertical_flip: bool = False
    rotation: int = Field(default=15, ge=0, le=45)
    brightness_contrast: bool = True
    gaussian_noise: bool = False
    blur: bool = False
    motion_blur: bool = False
    sharpen: bool = False
    color_jitter: bool = False
    random_gamma: bool = False
    rgb_shift: bool = False
    channel_shuffle: bool = False
    perspective: bool = False
    elastic_transform: bool = False
    grid_distortion: bool = False
    coarse_dropout: bool = False
    augmentations_per_image: int = Field(default=5, ge=1, le=30)
    test_split: float = Field(default=0.2, ge=0.0, le=0.8)


def _build_pipeline(config: AugmentationConfig) -> A.Compose:
    transforms: list[A.BasicTransform] = []

    if config.horizontal_flip:
        transforms.append(A.HorizontalFlip(p=0.7))
    if config.vertical_flip:
        transforms.append(A.VerticalFlip(p=0.45))
    if config.rotation > 0:
        transforms.append(A.Rotate(limit=(-config.rotation, config.rotation), p=0.8, border_mode=cv2.BORDER_REFLECT))
    if config.brightness_contrast:
        transforms.append(A.RandomBrightnessContrast(brightness_limit=0.3, contrast_limit=0.3, p=0.8))
    if config.gaussian_noise:
        transforms.append(A.GaussNoise(var_limit=(40.0, 120.0), mean=0, p=0.75))
    if config.blur:
        transforms.append(A.GaussianBlur(blur_limit=(3, 11), p=0.6))
    if config.motion_blur:
        transforms.append(A.MotionBlur(blur_limit=(5, 15), p=0.65))
    if config.sharpen:
        transforms.append(A.Sharpen(alpha=(0.2, 0.6), lightness=(0.7, 1.2), p=0.5))
    if config.color_jitter:
        transforms.append(A.HueSaturationValue(hue_shift_limit=20, sat_shift_limit=35, val_shift_limit=25, p=0.65))
    if config.random_gamma:
        transforms.append(A.RandomGamma(gamma_limit=(70, 140), p=0.5))
    if config.rgb_shift:
        transforms.append(A.RGBShift(r_shift_limit=25, g_shift_limit=25, b_shift_limit=25, p=0.55))
    if config.channel_shuffle:
        transforms.append(A.ChannelShuffle(p=0.35))
    if config.perspective:
        transforms.append(A.Perspective(scale=(0.03, 0.08), p=0.45))
    if config.elastic_transform:
        transforms.append(A.ElasticTransform(alpha=1.2, sigma=40, alpha_affine=25, p=0.4))
    if config.grid_distortion:
        transforms.append(A.GridDistortion(num_steps=5, distort_limit=0.25, p=0.35))
    if config.coarse_dropout:
        transforms.append(
            A.CoarseDropout(
                max_holes=10,
                max_height=24,
                max_width=24,
                min_holes=2,
                min_height=8,
                min_width=8,
                fill_value=0,
                p=0.5,
            )
        )

    if not transforms:
        transforms = [A.NoOp()]

    return A.Compose(transforms)


def _selected_option_count(config: AugmentationConfig) -> int:
    enabled_count = 0
    enabled_count += int(config.horizontal_flip)
    enabled_count += int(config.vertical_flip)
    enabled_count += int(config.rotation > 0)
    enabled_count += int(config.brightness_contrast)
    enabled_count += int(config.gaussian_noise)
    enabled_count += int(config.blur)
    enabled_count += int(config.motion_blur)
    enabled_count += int(config.sharpen)
    enabled_count += int(config.color_jitter)
    enabled_count += int(config.random_gamma)
    enabled_count += int(config.rgb_shift)
    enabled_count += int(config.channel_shuffle)
    enabled_count += int(config.perspective)
    enabled_count += int(config.elastic_transform)
    enabled_count += int(config.grid_distortion)
    enabled_count += int(config.coarse_dropout)
    return enabled_count


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


def _augment_preview(image_bytes: bytes, pipeline: A.Compose) -> np.ndarray:
    image = _to_cv_image(image_bytes)
    return pipeline(image=image)["image"]


def _to_data_uri(image: np.ndarray) -> str:
    ok, encoded = cv2.imencode(".png", image)
    if not ok:
        raise RuntimeError("Failed to encode preview image")
    payload = base64.b64encode(encoded.tobytes()).decode("utf-8")
    return f"data:image/png;base64,{payload}"


def _augment_image_set(
    image_name: str,
    image_bytes: bytes,
    output_root: Path,
    pipeline: A.Compose,
    train_augment_count: int,
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

    for idx in range(train_augment_count):
        augmented = pipeline(image=image)["image"]
        unique_suffix = uuid.uuid4().hex[:8]
        file_name = f"{stem}_train_aug_{idx + 1}_{unique_suffix}{ext}"
        _save_image(train_dir / file_name, augmented)

    test_count = int(round(train_augment_count * test_split))
    for idx in range(test_count):
        augmented = pipeline(image=image)["image"]
        unique_suffix = uuid.uuid4().hex[:8]
        file_name = f"{stem}_test_aug_{idx + 1}_{unique_suffix}{ext}"
        _save_image(test_dir / file_name, augmented)


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
    selected_option_count = _selected_option_count(parsed_config)
    train_augment_count = selected_option_count if selected_option_count > 0 else parsed_config.augmentations_per_image

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
                    train_augment_count,
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


@app.post("/preview")
async def preview(
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

    for file in files:
        extension = Path(file.filename or "").suffix.lower()
        if extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Unsupported file format: {file.filename}")

    pipeline = _build_pipeline(parsed_config)

    try:
        response_payload: list[dict[str, str]] = []
        for file in files:
            image_bytes = await file.read()
            augmented = await run_in_threadpool(_augment_preview, image_bytes, pipeline)
            response_payload.append(
                {
                    "file_name": file.filename or "uploaded_image",
                    "preview_data_uri": _to_data_uri(augmented),
                }
            )

        return {"previews": response_payload}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Preview generation failed: {exc}") from exc
