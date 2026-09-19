"""Train Scikit-Learn NLP models for Incident Type and Severity/Priority prediction.

Uses TF-IDF feature extraction with Logistic Regression classifiers trained on
the synthetic emergency incidents dataset. Serializes the trained models for fast inference.
"""

import json
import hashlib
from datetime import UTC, datetime
from pathlib import Path

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

BASE_DIR = Path(__file__).resolve().parent
CONTAINER_DATASET_PATH = BASE_DIR / "data" / "emergency_incidents.json"
REPO_DATASET_PATH = BASE_DIR.parents[2] / "data" / "synthetic" / "emergency_incidents.json"
MODEL_DIR = BASE_DIR / "model_weights"
MODEL_PATH = MODEL_DIR / "incident_classifier.joblib"


def load_dataset() -> list[dict]:
    if CONTAINER_DATASET_PATH.exists():
        path = CONTAINER_DATASET_PATH
    elif REPO_DATASET_PATH.exists():
        path = REPO_DATASET_PATH
    else:
        msg = f"Dataset not found at {CONTAINER_DATASET_PATH} or {REPO_DATASET_PATH}"
        raise FileNotFoundError(msg)
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def build_pipeline() -> Pipeline:
    return Pipeline(
        [
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=3000, sublinear_tf=True)),
            ("clf", LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42)),
        ]
    )


def train_models():
    data = load_dataset()
    texts = [item["description"] for item in data]
    types = [item["incident_type"] for item in data]
    severities = [item["severity"] for item in data]

    # Combined input for severity includes type hint if available
    type_and_texts = [f"[{item['incident_type']}] {item['description']}" for item in data]

    # Split for evaluation
    X_train_type, X_test_type, y_train_type, y_test_type = train_test_split(
        texts, types, test_size=0.2, random_state=42, stratify=types
    )
    X_train_sev, X_test_sev, y_train_sev, y_test_sev = train_test_split(
        type_and_texts, severities, test_size=0.2, random_state=42, stratify=severities
    )

    print("--- Training Incident Type Classifier ---")
    type_pipeline = build_pipeline()
    type_pipeline.fit(X_train_type, y_train_type)
    type_preds = type_pipeline.predict(X_test_type)
    type_report = classification_report(y_test_type, type_preds, output_dict=True, zero_division=0)
    print(classification_report(y_test_type, type_preds, zero_division=0))

    print("--- Training Incident Severity Classifier ---")
    severity_pipeline = build_pipeline()
    severity_pipeline.fit(X_train_sev, y_train_sev)
    sev_preds = severity_pipeline.predict(X_test_sev)
    severity_report = classification_report(y_test_sev, sev_preds, output_dict=True, zero_division=0)
    print(classification_report(y_test_sev, sev_preds, zero_division=0))

    # Retrain on full dataset for production weights
    type_pipeline.fit(texts, types)
    severity_pipeline.fit(type_and_texts, severities)

    # Ensure model directory exists
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    artifacts = {
        "type_pipeline": type_pipeline,
        "severity_pipeline": severity_pipeline,
        "version": "1.1.0",
        "trained_at": datetime.now(UTC).isoformat(),
        "dataset_sha256": hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest(),
        "evaluation": {
            "split": "stratified 80/20 holdout, random_state=42",
            "type": type_report,
            "severity": severity_report,
        },
    }
    joblib.dump(artifacts, MODEL_PATH)
    print(f"Models successfully trained and exported to: {MODEL_PATH}")


if __name__ == "__main__":
    train_models()
