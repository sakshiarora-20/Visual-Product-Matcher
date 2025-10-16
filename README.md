
# Visual Product Matcher

A web application that allows users to upload an image or provide an image URL to find visually similar fashion products from a dataset using **CLIP embeddings**.

## Live Demo

Frontend hosted on **Vercel**:
[https://visual-product-matcher-lemon-eight.vercel.app/](https://visual-product-matcher-lemon-eight.vercel.app/)

> Note: Attempted backend  deployment on Render and other free-tier services failed due to memory constraints.

## Features

* Upload an image or provide an image URL.
* Predict the product category automatically.
* Find visually similar items from the dataset.
* Filter results based on similarity score.
* Light/Dark mode toggle.
* Responsive and interactive UI with smooth animations.

## Dataset

This project uses the **Fashion Product Images Dataset** from Kaggle:
[https://www.kaggle.com/datasets/paramaggarwal/fashion-product-images-dataset](https://www.kaggle.com/datasets/paramaggarwal/fashion-product-images-dataset)

* Subset of 550 images is used for faster experimentation.
* Embeddings for the subset were precomputed in Google Colab and saved in `embeddings.json`.
* Metadata is stored in `metadata_550.json`.

## Backend

Built with **FastAPI**, **CLIP**, and **PyTorch**.

### Features:

* Accepts both image uploads and URLs.
* Computes image embeddings using CLIP (`ViT-B/32`).
* Predicts the product category.
* Returns top visually similar matches filtered by minimum similarity score.
* Serves product images via static files.

### Running Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Start the backend
uvicorn app:app --reload
```

* The backend exposes:

  * `GET /` — Health check
  * `POST /match` — Accepts `file` (image upload) or `url` (image URL) and optional `min_score`.

### Note

* The model runs on CPU/GPU depending on availability.
* The dataset subset and embeddings are loaded from `data/images/subset_550/`, `embeddings.json`, and `metadata_550.json`.

## Frontend

Built with **React** and **Framer Motion**.

### Features:

* Upload image or input image URL.
* Display predicted category.
* Interactive slider to filter matches by similarity score.
* Responsive card grid for match results.
* Toggle light/dark mode.

### Running Locally

```bash
# Install dependencies
npm install

# Start the frontend
npm run dev
```

* Backend must be running at `http://127.0.0.1:8000/match` or update `backendURL` in `App.js`.

## Project Structure

```
Visual-Product-Matcher/
│
├─ backend/
│   ├─ app.py               # FastAPI backend
│   ├─ data/
│   │   ├─ images/subset_550/
│   │   ├─ embeddings.json
│   │   └─ metadata_550.json
│   └─ requirements.txt
│
├─ frontend/
│   ├─ src/
│   │   └─ App.js           # Main React app
│   └─ package.json
│
└─ README.md
```



