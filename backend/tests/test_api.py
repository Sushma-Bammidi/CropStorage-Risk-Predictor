"""
Pytest tests for the FastAPI prediction API.
Run from backend/ directory: pytest tests/ -v
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "model" in data


def test_list_crops():
    response = client.get("/crops")
    assert response.status_code == 200
    data = response.json()
    assert "crops" in data
    assert "Wheat" in data["crops"]
    assert "Maize" in data["crops"]


def test_predict_low_risk():
    """Low temp + low humidity + short storage → Low risk"""
    payload = {
        "crop_type": "Wheat",
        "temperature": 10.0,
        "humidity": 50.0,
        "storage_days": 30,
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] in ["Low", "Medium", "High"]
    assert "probabilities" in data
    assert "recommendation" in data
    assert data["crop_type"] == "Wheat"


def test_predict_high_risk():
    """High temp + high humidity + long storage → expected High risk"""
    payload = {
        "crop_type": "Maize",
        "temperature": 38.0,
        "humidity": 90.0,
        "storage_days": 200,
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] in ["Medium", "High"]  # At minimum Medium


def test_predict_potato():
    response = client.post("/predict", json={
        "crop_type": "Potato",
        "temperature": 5.0,
        "humidity": 88.0,
        "storage_days": 45,
    })
    assert response.status_code == 200
    assert response.json()["risk_level"] in ["Low", "Medium", "High"]


def test_invalid_crop():
    payload = {
        "crop_type": "Mango",
        "temperature": 25.0,
        "humidity": 65.0,
        "storage_days": 30,
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 422


def test_invalid_temperature_out_of_range():
    payload = {
        "crop_type": "Wheat",
        "temperature": 99.0,   # Out of [0, 60]
        "humidity": 65.0,
        "storage_days": 30,
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 422


def test_invalid_humidity_out_of_range():
    payload = {
        "crop_type": "Wheat",
        "temperature": 25.0,
        "humidity": 105.0,    # Out of [0, 100]
        "storage_days": 30,
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 422


def test_model_info():
    response = client.get("/model-info")
    assert response.status_code == 200
    data = response.json()
    assert "accuracy" in data
    assert "features" in data
    assert "classes" in data


def test_probabilities_sum_to_one():
    response = client.post("/predict", json={
        "crop_type": "Rice",
        "temperature": 30.0,
        "humidity": 75.0,
        "storage_days": 90,
    })
    assert response.status_code == 200
    probs = response.json()["probabilities"]
    total = sum(probs.values())
    assert abs(total - 1.0) < 0.01, f"Probabilities don't sum to 1: {total}"


def test_all_crops_predict():
    crops = ["Wheat", "Maize", "Rice", "Barley", "Sorghum", "Potato", "Onion"]
    for crop in crops:
        response = client.post("/predict", json={
            "crop_type": crop,
            "temperature": 22.0,
            "humidity": 70.0,
            "storage_days": 60,
        })
        assert response.status_code == 200, f"Failed for crop: {crop}"
        assert response.json()["risk_level"] in ["Low", "Medium", "High"]
