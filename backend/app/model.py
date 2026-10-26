"""
Model loader and inference module for FastAPI.
Loads artifacts once at startup, exposes predict().
"""

import os
import json
import numpy as np
import joblib
from typing import Dict, Tuple

BASE_DIR       = os.path.dirname(os.path.abspath(__file__))
ARTIFACTS_DIR  = os.path.join(BASE_DIR, "..", "ml", "model_artifacts")
MODEL_PATH     = os.path.join(ARTIFACTS_DIR, "rf_model.pkl")
LE_PATH        = os.path.join(ARTIFACTS_DIR, "label_encoder.pkl")
META_PATH      = os.path.join(ARTIFACTS_DIR, "model_meta.json")

# ── Load once at import time ───────────────────────────────────────────────────
_model     = joblib.load(MODEL_PATH)
_le_crop   = joblib.load(LE_PATH)

with open(META_PATH, "r") as f:
    _meta = json.load(f)

CROP_CLASSES: list = _meta["crop_classes"]
RISK_CLASSES: list = _meta["classes"]   # e.g. ["High","Low","Medium"]

# ── Recommendation templates ───────────────────────────────────────────────────
_RECOMMENDATIONS = {
    "Low": (
        "✅ Storage conditions are optimal. Maintain current temperature and humidity levels. "
        "Continue regular monitoring every 2 weeks."
    ),
    "Medium": (
        "⚠️ Moderate spoilage risk detected. Reduce temperature by 3–5°C if possible and "
        "improve ventilation to lower humidity. Inspect stock within 7 days."
    ),
    "High": (
        "🚨 High spoilage risk! Immediate action required: reduce temperature, increase "
        "airflow, check for pest or moisture intrusion, and consider relocating or processing "
        "the crop within 48–72 hours."
    ),
}

# Per-crop extra tips
_CROP_TIPS = {
    "Wheat":   "Ensure moisture content stays below 14%. Use hermetic bags for long-term storage.",
    "Maize":   "Target moisture ≤ 13%. Watch for aflatoxin risk at high humidity.",
    "Rice":    "Keep paddy moisture at 14% or below. Avoid direct sunlight exposure.",
    "Barley":  "Store at cool, dry conditions. Malting barley needs special low-temp storage.",
    "Sorghum": "Resistant to heat but sensitive to moisture. Target RH < 65%.",
    "Potato":  "Keep in darkness at 4–8°C. Avoid freezing. Monitor for sprouting.",
    "Onion":   "Requires cool, dry, well-ventilated storage. Avoid high humidity (> 75%).",
}


def predict(
    crop_type: str,
    temperature: float,
    humidity: float,
    storage_days: int,
) -> Tuple[str, Dict[str, float], str]:
    """
    Returns (risk_level, probabilities_dict, recommendation_text).
    Raises ValueError for unknown crop type.
    """
    if crop_type not in CROP_CLASSES:
        raise ValueError(f"Unknown crop_type '{crop_type}'. Supported: {CROP_CLASSES}")

    crop_encoded = _le_crop.transform([crop_type])[0]
    X = np.array([[crop_encoded, temperature, humidity, storage_days]], dtype=float)

    proba_arr  = _model.predict_proba(X)[0]
    risk_level = _model.predict(X)[0]

    probabilities = {cls: round(float(p), 4) for cls, p in zip(RISK_CLASSES, proba_arr)}

    rec = _RECOMMENDATIONS[risk_level]
    tip = _CROP_TIPS.get(crop_type, "")
    recommendation = f"{rec} {tip}".strip()

    return risk_level, probabilities, recommendation


def get_model_meta() -> dict:
    return _meta
