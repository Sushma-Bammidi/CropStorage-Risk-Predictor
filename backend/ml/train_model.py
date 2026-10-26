"""
Train a Random Forest classifier to predict crop spoilage risk.
Outputs rf_model.pkl and label_encoder.pkl to model_artifacts/
"""

import os
import sys
import json
import numpy as np
import pandas as pd
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    classification_report, confusion_matrix, accuracy_score
)

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
DATA_PATH  = os.path.join(BASE_DIR, "..", "app", "data", "crop_storage_dataset.csv")
ARTIFACTS  = os.path.join(BASE_DIR, "model_artifacts")
MODEL_PATH = os.path.join(ARTIFACTS, "rf_model.pkl")
LE_PATH    = os.path.join(ARTIFACTS, "label_encoder.pkl")
META_PATH  = os.path.join(ARTIFACTS, "model_meta.json")


def train():
    os.makedirs(ARTIFACTS, exist_ok=True)

    # ── 1. Load dataset ─────────────────────────────────────────────────────
    if not os.path.exists(DATA_PATH):
        print("Dataset not found. Generating it first...")
        sys.path.insert(0, BASE_DIR)
        from generate_dataset import generate_dataset
        generate_dataset(output_path=DATA_PATH)

    df = pd.read_csv(DATA_PATH)
    print(f"[INFO] Dataset loaded: {df.shape[0]} rows x {df.shape[1]} cols")

    # ── 2. Encode crop_type ─────────────────────────────────────────────────
    le_crop = LabelEncoder()
    df["crop_encoded"] = le_crop.fit_transform(df["crop_type"])

    # ── 3. Features & target ────────────────────────────────────────────────
    FEATURES = ["crop_encoded", "temperature", "humidity", "storage_days"]
    TARGET   = "risk_level"

    le_risk = LabelEncoder()
    le_risk.classes_ = np.array(["High", "Low", "Medium"])  # fixed order

    X = df[FEATURES].values
    y = df[TARGET].values

    # ── 4. Train / test split ───────────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # ── 5. Train Random Forest ──────────────────────────────────────────────
    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        min_samples_split=4,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X_train, y_train)

    # ── 6. Evaluate ─────────────────────────────────────────────────────────
    y_pred = clf.predict(X_test)
    acc    = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)
    cm     = confusion_matrix(y_test, y_pred, labels=["Low", "Medium", "High"])

    print(f"\n{'='*55}")
    print("  MODEL EVALUATION RESULTS")
    print(f"{'='*55}")
    print(f"  Test Accuracy          : {acc*100:.2f}%")
    print(f"\n{classification_report(y_test, y_pred)}")
    print("  Confusion Matrix (Low | Medium | High):")
    print(cm)
    print(f"{'='*55}\n")

    # Cross-val
    cv_scores = cross_val_score(clf, X, y, cv=5, scoring="accuracy")
    print(f"  5-Fold CV Accuracy: {cv_scores.mean()*100:.2f}% ± {cv_scores.std()*100:.2f}%\n")

    # Feature importance
    fi = dict(zip(FEATURES, clf.feature_importances_.tolist()))
    print("  Feature Importances:")
    for fname, imp in sorted(fi.items(), key=lambda x: -x[1]):
        print(f"    {fname:<20}: {imp:.4f}")

    # ── 7. Save artifacts ───────────────────────────────────────────────────
    joblib.dump(clf, MODEL_PATH)
    joblib.dump(le_crop, LE_PATH)

    meta = {
        "accuracy": round(acc, 4),
        "cv_mean":  round(cv_scores.mean(), 4),
        "cv_std":   round(cv_scores.std(), 4),
        "features": FEATURES,
        "classes":  list(clf.classes_),
        "crop_classes": list(le_crop.classes_),
        "feature_importances": fi,
        "classification_report": report,
        "confusion_matrix": cm.tolist(),
    }
    with open(META_PATH, "w") as f:
        json.dump(meta, f, indent=2)

    print(f"\n[OK] Model saved   -> {MODEL_PATH}")
    print(f"[OK] Encoder saved -> {LE_PATH}")
    print(f"[OK] Meta saved    -> {META_PATH}")
    return clf, le_crop, meta


if __name__ == "__main__":
    train()
