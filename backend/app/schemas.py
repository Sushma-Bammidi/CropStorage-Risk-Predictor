from pydantic import BaseModel, Field
from typing import Dict


SUPPORTED_CROPS = [
    "Wheat", "Maize", "Rice", "Barley", "Sorghum", "Potato", "Onion"
]


class PredictionRequest(BaseModel):
    crop_type: str = Field(..., description="Type of crop stored")
    temperature: float = Field(..., ge=0, le=60, description="Storage temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Relative humidity percentage")
    storage_days: int = Field(..., ge=1, le=730, description="Number of days in storage")

    model_config = {
        "json_schema_extra": {
            "example": {
                "crop_type": "Wheat",
                "temperature": 25.0,
                "humidity": 65.0,
                "storage_days": 30
            }
        }
    }


class PredictionResponse(BaseModel):
    risk_level: str = Field(..., description="Predicted spoilage risk: Low, Medium, or High")
    probabilities: Dict[str, float] = Field(..., description="Probability for each risk class")
    recommendation: str = Field(..., description="Storage recommendation based on risk")
    crop_type: str
    temperature: float
    humidity: float
    storage_days: int
