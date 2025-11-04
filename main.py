from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
import tempfile
import requests
import os

# Import YOLO detection helper
from yolo.run_detect import detect_potholes


class DetectRequest(BaseModel):
    image_url: HttpUrl
    conf_threshold: float | None = 0.25


app = FastAPI(title="Pothole Detection Service")

# Allow local dev origins; adjust as needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/detect")
def detect(request: DetectRequest):
    try:
        # Download the image to a temp file
        response = requests.get(str(request.image_url), timeout=30)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to download image")

        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            tmp.write(response.content)
            tmp_path = tmp.name

        try:
            # Run detection
            model_path = os.path.join("yolo", "best.pt")
            result = detect_potholes(model_path=model_path, image_path=tmp_path, conf_threshold=request.conf_threshold or 0.25)
            detected = (result.get("num_potholes", 0) > 0)
            return {
                "detected": detected,
                "num_potholes": result.get("num_potholes", 0),
                "mean_confidence": result.get("mean_confidence", 0.0),
                "annotated_image": result.get("annotated_image"),
            }
        finally:
            # Cleanup temp file
            try:
                os.remove(tmp_path)
            except Exception:
                pass
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Optional: simple health check
@app.get("/health")
def health():
    return {"status": "ok"}


# For running via `python main.py` in dev using uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
