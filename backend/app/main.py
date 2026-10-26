"""
FastAPI application entry point for the Smart Crop Storage Spoilage Predictor.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.schemas import PredictionRequest, PredictionResponse, SUPPORTED_CROPS
from app import model as ml

app = FastAPI(
    title="Smart Crop Storage Spoilage Predictor API",
    description=(
        "Predicts crop spoilage risk (Low / Medium / High) based on "
        "crop type, storage temperature, humidity, and storage duration."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://*.vercel.app",
        "*",   # Open for demo; restrict in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
def health_check():
    """Liveness check for Render health probes."""
    return {"status": "ok", "model": "Random Forest", "version": "1.0.0"}


@app.get("/crops", tags=["System"])
def list_crops():
    """Returns the list of supported crop types."""
    return {"crops": ml.CROP_CLASSES}


@app.get("/model-info", tags=["System"])
def model_info():
    """Returns model training metadata (accuracy, feature importances, etc.)."""
    return JSONResponse(content=ml.get_model_meta())


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
def predict(request: PredictionRequest):
    """
    Predict spoilage risk for stored crops.

    - **crop_type**: One of Wheat, Maize, Rice, Barley, Sorghum, Potato, Onion
    - **temperature**: Storage temperature in °C (0–60)
    - **humidity**: Relative humidity % (0–100)
    - **storage_days**: Days the crop has been in storage (1–730)
    """
    if request.crop_type not in SUPPORTED_CROPS:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported crop '{request.crop_type}'. Supported: {SUPPORTED_CROPS}",
        )

    try:
        risk_level, probabilities, recommendation = ml.predict(
            crop_type=request.crop_type,
            temperature=request.temperature,
            humidity=request.humidity,
            storage_days=request.storage_days,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return PredictionResponse(
        risk_level=risk_level,
        probabilities=probabilities,
        recommendation=recommendation,
        crop_type=request.crop_type,
        temperature=request.temperature,
        humidity=request.humidity,
        storage_days=request.storage_days,
    )
