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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

IMG_DIR = "data/images/subset_550"
app.mount("/images", StaticFiles(directory=IMG_DIR), name="images")

device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

with open("data/embeddings.json", "r") as f:
    emb_dict = json.load(f)

img_names = list(emb_dict.keys())
img_embs = torch.tensor(np.array(list(emb_dict.values()), dtype=np.float32)).to(device)

with open("data/metadata_550.json", "r") as f:
    raw_meta = json.load(f)

meta = {}
for k, v in raw_meta.items():
    fname = f"{k}.jpg"
    meta[fname] = {"cat": v["category"], "name": v["name"]}

cats = list({v["cat"] for v in meta.values()})
with torch.no_grad():
    text_tokens = clip.tokenize(cats).to(device)
    cat_embs = model.encode_text(text_tokens)
    cat_embs /= cat_embs.norm(dim=-1, keepdim=True)

def predict_cat(img_emb):
    img_emb /= img_emb.norm()
    sims = (cat_embs @ img_emb.T).cpu().numpy().flatten()
    return cats[sims.argmax()]

def top_matches(query_emb, query_cat=None, min_score=0.0):
    query_emb /= query_emb.norm()
    sims = (img_embs @ query_emb.T).cpu().numpy()
    res = []
    for i, s in enumerate(sims):
        if s < min_score:
            continue
        fname = f"{img_names[i]}.jpg"
        if query_cat and meta.get(fname, {}).get("cat", "").lower() != query_cat.lower():
            continue
        res.append({"image": fname, "score": float(s), "cat": meta.get(fname, {}).get("cat", "Unknown")})
    res.sort(key=lambda x: x["score"], reverse=True)
    return res

@app.get("/")
def home():
    return {"message": "Visual Product Matcher API is running!"}

@app.post("/match")
async def match(file: UploadFile = File(None), url: str = Query(None), min_score: float = Query(0.0)):
    if not file and not url:
        raise HTTPException(status_code=400, detail="Provide either an image file or a URL.")
    if file:
        img = Image.open(io.BytesIO(await file.read())).convert("RGB")
    else:
        try:
            resp = requests.get(url, stream=True, timeout=5)
            resp.raise_for_status()
            img = Image.open(resp.raw).convert("RGB")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Could not fetch image: {e}")
    img_input = preprocess(img).unsqueeze(0).to(device)
    with torch.no_grad():
        img_emb = model.encode_image(img_input)[0]
    cat_pred = predict_cat(img_emb)
    matches = top_matches(img_emb, query_cat=cat_pred, min_score=min_score)
    return {"predicted_category": cat_pred, "matches": matches}
