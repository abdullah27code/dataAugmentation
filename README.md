# AI Data Augmentation Tool

A production-ready web app to upload images, apply configurable augmentations, and download a generated dataset ZIP for ML workflows.

## Tech Stack
- **Frontend:** React + Vite + TailwindCSS + Axios
- **Backend:** FastAPI + OpenCV + Albumentations

## Project Structure

```bash
/backend
  /app
    main.py
  requirements.txt
/frontend
  /src
    App.jsx
    styles.css
    /components
      UploadBox.jsx
      PreviewGrid.jsx
      Controls.jsx
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
- `POST /preview` → returns one augmented preview image per uploaded file (base64 data URI)
- `POST /augment` → upload images + config, returns ZIP

`/augment` accepts:
- `files`: multiple files (max 10, JPG/PNG)
- `config`: JSON string, e.g.

```json
{
  "horizontal_flip": true,
  "vertical_flip": false,
  "rotation": 20,
  "brightness_contrast": true,
  "gaussian_noise": false,
  "blur": true,
  "motion_blur": true,
  "sharpen": true,
  "color_jitter": true,
  "random_gamma": true,
  "rgb_shift": false,
  "channel_shuffle": false,
  "perspective": true,
  "elastic_transform": false,
  "grid_distortion": false,
  "coarse_dropout": false,
  "augmentations_per_image": 5,
  "test_split": 0.2
}
```

`/augment` behavior: train image count is derived from enabled augmentation options (if no option is enabled, `augmentations_per_image` is used). Test count is `round(train_count * test_split)`.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

If you see `'vite' is not recognized`, dependencies are not installed yet. Run:

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
4. Click **Generate Preview** to see one sample augmentation per uploaded image.
5. Click **Generate ZIP** to prepare the downloadable dataset.
6. Click **Download ZIP** when ready.

## One-command start (frontend + backend)

```bash
python start.py
```
`start.py` opens the browser automatically on `http://localhost:5173`, starts backend after a short delay, and shuts down both processes gracefully on `CTRL+C`.

Windows users can also run:

```bat
start.bat
```

Both launcher scripts auto-run `npm install` when frontend dependencies are missing.

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
- Augmentation pipeline includes optional heavier transforms (noise, motion blur, sharpen, color jitter) for more diverse synthetic data.
