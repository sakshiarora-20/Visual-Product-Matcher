from fastapi import FastAPI, UploadFile, File, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import numpy as np
import json
import torch
import clip
from PIL import Image
import io
import requests
app = FastAPI()

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve Images
IMAGES_DIR = "data/images/subset_550"
app.mount("/images", StaticFiles(directory=IMAGES_DIR), name="images")

# Load CLIP Model 
device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

# Load Embeddings 
with open("data/embeddings.json", "r") as f:
    embeddings_dict = json.load(f)

image_paths = list(embeddings_dict.keys())
image_embeddings = np.array(list(embeddings_dict.values()), dtype=np.float32)
image_embeddings = torch.tensor(image_embeddings).to(device)

# Load Metadata 
with open("data/metadata_550.json", "r") as f:
    raw_metadata = json.load(f)

metadata = {}
for key, value in raw_metadata.items():
    filename = f"{key}.jpg"
    metadata[filename] = {
        "category": value["category"],
        "name": value["name"]
    }

# CLIP Category Embeddings 
category_list = list({v["category"] for v in metadata.values()})
with torch.no_grad():
    text_inputs = clip.tokenize(category_list).to(device)
    category_text_embeddings = model.encode_text(text_inputs)
    category_text_embeddings /= category_text_embeddings.norm(dim=-1, keepdim=True)

# Helper Functions 
def predict_category(image_embedding):
    image_embedding /= image_embedding.norm()
    similarities = (category_text_embeddings @ image_embedding.T).cpu().numpy().flatten()
    predicted_index = similarities.argmax()
    return category_list[predicted_index]

def get_top_matches(query_embedding, query_category=None, min_score=0.0):
    query_embedding /= query_embedding.norm()
    similarities = (image_embeddings @ query_embedding.T).cpu().numpy()

    results = []
    for i, score in enumerate(similarities):
        if score >= min_score:
            filename = f"{image_paths[i]}.jpg"
            if query_category and metadata.get(filename, {}).get("category", "").lower() != query_category.lower():
                continue
            results.append({
                "image": filename,
                "score": float(score),
                "category": metadata.get(filename, {}).get("category", "Unknown")
            })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results

# API Routes 
@app.get("/")
def home():
    return {"message": " Visual Product Matcher API is running!"}

@app.post("/match")
async def match_image(
    file: UploadFile = File(None),
    url: str = Query(None),
    min_score: float = Query(0.0)
):
    if file is None and url is None:
        raise HTTPException(status_code=400, detail="Provide either an image file or an image URL.")

    # Read image from file
    if file:
        image = Image.open(io.BytesIO(await file.read())).convert("RGB")
    # Read image from URL
    else:
        try:
            response = requests.get(url, stream=True, timeout=5)
            response.raise_for_status()
            image = Image.open(response.raw).convert("RGB")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Could not fetch image from URL: {e}")

    # Preprocess image
    image_input = preprocess(image).unsqueeze(0).to(device)

    # Encode image
    with torch.no_grad():
        image_embedding = model.encode_image(image_input)[0]

    # Predict category
    predicted_category = predict_category(image_embedding)

    # Get filtered matches
    results = get_top_matches(image_embedding, query_category=predicted_category, min_score=min_score)

    return {
        "predicted_category": predicted_category,
        "matches": results
    }
