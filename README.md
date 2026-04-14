# AI Data Augmentation Tool

A production-ready web app to upload images, apply configurable augmentations, and download a generated dataset ZIP for ML workflows.

## Tech Stack
- **Frontend:** React + Vite + TailwindCSS + React Dropzone
- **Backend:** FastAPI + OpenCV + Albumentations

## Project Structure

```bash
/backend
  /app
    main.py
  requirements.txt
/frontend
  /src
```

## Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You can also run the API from the repository root:

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\\Scripts\\activate
pip install -r backend/requirements.txt
uvicorn main:app --reload
```

### Backend API
- `GET /health` → status check
- `POST /augment` → upload images + config, returns ZIP

`/augment` accepts:
- `files`: multiple files (max 10, JPG/PNG)
- `config`: JSON string, e.g.

```json
{
  "horizontal_flip": true,
  "rotation": 20,
  "brightness_contrast": true,
  "gaussian_noise": false,
  "blur": true,
  "augmentations_per_image": 5,
  "test_split": 0.2
}
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Optional: set backend URL

```bash
# frontend/.env
VITE_API_URL=http://localhost:8000
```

## Usage
1. Open frontend in browser (`http://localhost:5173` by default).
2. Drag & drop up to 10 JPG/PNG images.
3. Adjust augmentation toggles and sliders.
4. Click **Generate Augmented Dataset**.
5. Download the resulting ZIP.

## Output Layout (inside ZIP)

```bash
output/
  image_1/
    train/
      image_1_original.png
      image_1_aug_...png
    test/
      image_1_aug_...png
```

## Notes
- Processing runs in parallel threads for faster throughput.
- File names include unique suffixes to avoid overwrites.
- Temporary files are cleaned automatically after response.
