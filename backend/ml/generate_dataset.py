"""
Synthetic dataset generator for crop spoilage prediction.

Dataset is grounded in FAO/USDA post-harvest science thresholds.
No suitable freely available public CSV with all required features
(crop_type + temperature + humidity + storage_days → spoilage risk label)
was found in major repositories (Kaggle, UCI, Mendeley). The closest
existing datasets use gas/CO2 sensors without crop-type categorization.

References:
  - FAO (2011). "Rural Structures in Sub-Saharan Africa: Post-Harvest"
  - USDA Grain Storage Guidelines (AMS)
  - Brooker et al., "Drying and Storage of Grains and Oilseeds" (1992)
"""

import numpy as np
import pandas as pd
import os

np.random.seed(42)

N_SAMPLES = 9000

CROPS = ["Wheat", "Maize", "Rice", "Barley", "Sorghum", "Potato", "Onion"]

# Per-crop safe-zone thresholds (FAO/USDA guidelines)
# (max_safe_temp, max_safe_humidity, max_safe_days_at_medium_risk)
CROP_THRESHOLDS = {
    "Wheat":   {"safe_temp": 15, "safe_humidity": 65, "med_temp": 25, "med_humidity": 75},
    "Maize":   {"safe_temp": 12, "safe_humidity": 60, "med_temp": 25, "med_humidity": 70},
    "Rice":    {"safe_temp": 18, "safe_humidity": 70, "med_temp": 30, "med_humidity": 80},
    "Barley":  {"safe_temp": 15, "safe_humidity": 65, "med_temp": 25, "med_humidity": 75},
    "Sorghum": {"safe_temp": 20, "safe_humidity": 65, "med_temp": 30, "med_humidity": 75},
    "Potato":  {"safe_temp": 10, "safe_humidity": 85, "med_temp": 18, "med_humidity": 92},
    "Onion":   {"safe_temp": 5,  "safe_humidity": 70, "med_temp": 15, "med_humidity": 80},
}

# Safe storage days per crop (long-term shelf life)
SAFE_DAYS = {
    "Wheat": 365, "Maize": 270, "Rice": 365, "Barley": 300,
    "Sorghum": 270, "Potato": 90, "Onion": 120,
}


def assign_risk(row):
    crop = row["crop_type"]
    temp = row["temperature"]
    humidity = row["humidity"]
    days = row["storage_days"]

    th = CROP_THRESHOLDS[crop]
    safe_days = SAFE_DAYS[crop]

    temp_score = 0
    hum_score = 0
    days_score = 0

    # Temperature scoring
    if temp <= th["safe_temp"]:
        temp_score = 0
    elif temp <= th["med_temp"]:
        temp_score = 1
    else:
        temp_score = 2

    # Humidity scoring
    if humidity <= th["safe_humidity"]:
        hum_score = 0
    elif humidity <= th["med_humidity"]:
        hum_score = 1
    else:
        hum_score = 2

    # Days scoring
    if days <= safe_days * 0.4:
        days_score = 0
    elif days <= safe_days * 0.75:
        days_score = 1
    else:
        days_score = 2

    # Interaction: high temp AND high humidity is especially dangerous
    combo_score = temp_score + hum_score + days_score
    if temp_score == 2 and hum_score == 2:
        combo_score += 1  # Extra penalty for worst combo

    # Map to risk label
    if combo_score <= 1:
        return "Low"
    elif combo_score <= 3:
        return "Medium"
    else:
        return "High"


def generate_dataset(n=N_SAMPLES, output_path=None):
    crop_types = np.random.choice(CROPS, size=n)

    # Sample temperature and humidity per crop with realistic ranges
    temperatures = np.zeros(n)
    humidities = np.zeros(n)
    storage_days = np.zeros(n, dtype=int)

    for i, crop in enumerate(crop_types):
        temperatures[i] = np.round(np.random.uniform(2, 42), 1)
        humidities[i] = np.round(np.random.uniform(30, 98), 1)
        storage_days[i] = int(np.random.randint(1, SAFE_DAYS[crop] * 1.2 + 1))

    df = pd.DataFrame({
        "crop_type": crop_types,
        "temperature": temperatures,
        "humidity": humidities,
        "storage_days": storage_days,
    })

    df["risk_level"] = df.apply(assign_risk, axis=1)

    # Add a small amount of noise to simulate real-world label uncertainty (~3%)
    noise_idx = np.random.choice(df.index, size=int(0.03 * n), replace=False)
    risk_map = {"Low": ["Medium", "High"], "Medium": ["Low", "High"], "High": ["Low", "Medium"]}
    for idx in noise_idx:
        current = df.at[idx, "risk_level"]
        df.at[idx, "risk_level"] = np.random.choice(risk_map[current])

    if output_path is None:
        output_path = os.path.join(os.path.dirname(__file__), "..", "app", "data", "crop_storage_dataset.csv")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)

    print(f"[OK] Dataset saved to: {output_path}")
    print(f"     Total samples : {len(df)}")
    print(f"     Risk distribution:\n{df['risk_level'].value_counts()}")
    print(f"     Crop distribution:\n{df['crop_type'].value_counts()}")
    return df


if __name__ == "__main__":
    generate_dataset()
