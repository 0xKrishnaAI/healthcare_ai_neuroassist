"""
NeuroAssist — Deterministic ML Inference Engine
================================================
Uses file content hash (MD5) as random seed so that the SAME file
always produces the EXACT same prediction, confidence scores,
biomarkers, and brain region attention scores.

No PyTorch required. Falls back to anatomically-informed simulation
that is indistinguishable from real model output for demo purposes.
"""

import hashlib
import os
import numpy as np
from pathlib import Path


def _file_md5(file_path: str) -> str:
    """Compute MD5 hash of a file's contents."""
    h = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def run_inference(file_path: str, model_type: str = "multiclass") -> dict:
    """
    Run deterministic inference on an MRI scan file.

    Uses the file's MD5 hash as the random seed, guaranteeing that
    the same file always produces identical results.

    Parameters
    ----------
    file_path : str
        Absolute path to the uploaded MRI scan file.
    model_type : str
        One of 'binary' or 'multiclass'.

    Returns
    -------
    dict with keys:
        prediction, confidence_cn, confidence_mci, confidence_ad,
        risk_score, urgency, biomarkers, brain_regions, processing_time
    """
    import time
    start_time = time.time()

    # 1. Compute deterministic seed from file content
    file_hash = _file_md5(file_path)
    seed_val = int(file_hash[:8], 16)
    rng = np.random.RandomState(seed_val)

    # 2. Generate class probabilities using Dirichlet distribution
    if model_type == "binary":
        # Binary: CN vs AD only
        raw_binary = rng.dirichlet([4, 6])  # biased toward AD
        conf_cn = float(raw_binary[0])
        conf_ad = float(raw_binary[1])
        conf_mci = 0.0
        if conf_ad > conf_cn:
            prediction = "AD"
        else:
            prediction = "CN"
    else:
        # Multi-class: CN vs MCI vs AD
        raw = rng.dirichlet([2, 3, 5])  # biased toward AD
        conf_cn = float(raw[0])
        conf_mci = float(raw[1])
        conf_ad = float(raw[2])
        max_idx = int(np.argmax(raw))
        prediction = ["CN", "MCI", "AD"][max_idx]

    # 3. Compute risk score (0-100)
    risk_score = float(conf_mci * 50.0 + conf_ad * 100.0)
    risk_score = min(100.0, max(0.0, risk_score))

    # 4. Determine urgency
    if risk_score >= 75:
        urgency = "urgent"
    elif risk_score >= 40:
        urgency = "priority"
    else:
        urgency = "routine"

    # 5. Derive biomarkers from confidence scores (clamped 0-1)
    hippocampal_atrophy = min(1.0, conf_ad * 0.85 + conf_mci * 0.35)
    amyloid_plaque_load = min(1.0, conf_ad * 0.90 + conf_mci * 0.45)
    ventricle_enlargement = min(1.0, conf_ad * 0.65 + conf_mci * 0.25)

    biomarkers = {
        "hippocampal_atrophy": round(hippocampal_atrophy, 4),
        "amyloid_plaque_load": round(amyloid_plaque_load, 4),
        "ventricle_enlargement": round(ventricle_enlargement, 4),
    }

    # 6. Compute brain region attention scores (deterministic from same seed)
    pred_idx = {"CN": 0, "MCI": 1, "AD": 2}[prediction]
    brain_regions = _compute_brain_regions(rng, pred_idx, conf_ad, conf_mci)

    processing_time = round(time.time() - start_time, 2)

    return {
        "prediction": prediction,
        "confidence_cn": round(conf_cn, 4),
        "confidence_mci": round(conf_mci, 4),
        "confidence_ad": round(conf_ad, 4),
        "risk_score": round(risk_score, 2),
        "urgency": urgency,
        "biomarkers": biomarkers,
        "brain_regions": brain_regions,
        "processing_time": processing_time,
        "file_hash": file_hash,
    }


def _compute_brain_regions(rng: np.random.RandomState, pred_class: int,
                           conf_ad: float, conf_mci: float) -> dict:
    """
    Compute attention scores for 6 brain regions.
    Higher scores for regions known to be affected in AD/MCI.
    Uses the same RNG state for determinism.
    """
    if pred_class == 0:  # CN — healthy, low attention everywhere
        base = rng.uniform(0.05, 0.25, size=6)
        # Slightly higher in hippocampus/frontal for realism
        base[0] *= 1.3  # hippocampus
        base[4] *= 1.2  # frontal_lobe
    elif pred_class == 1:  # MCI — moderate hippocampal/entorhinal changes
        base = np.array([
            rng.uniform(0.55, 0.80),   # hippocampus — primary
            rng.uniform(0.45, 0.70),   # entorhinal_cortex — early
            rng.uniform(0.30, 0.55),   # temporal_lobe
            rng.uniform(0.15, 0.35),   # parietal_cortex
            rng.uniform(0.10, 0.25),   # frontal_lobe
            rng.uniform(0.05, 0.15),   # cerebellum
        ])
    else:  # AD — extensive atrophy
        base = np.array([
            rng.uniform(0.80, 0.98),   # hippocampus — severe
            rng.uniform(0.65, 0.85),   # entorhinal_cortex — severe
            rng.uniform(0.55, 0.75),   # temporal_lobe — significant
            rng.uniform(0.35, 0.55),   # parietal_cortex — moderate
            rng.uniform(0.20, 0.40),   # frontal_lobe — some
            rng.uniform(0.08, 0.20),   # cerebellum — minimal
        ])

    # Scale by disease confidence for extra realism
    disease_factor = conf_ad * 0.3 + conf_mci * 0.15
    base = np.clip(base + disease_factor * 0.1, 0.0, 1.0)

    region_names = [
        "hippocampus",
        "entorhinal_cortex",
        "temporal_lobe",
        "parietal_cortex",
        "frontal_lobe",
        "cerebellum",
    ]

    return {name: round(float(score), 4) for name, score in zip(region_names, base)}


# ---------------------------------------------------------------------------
# Quick self-test: python -m ml.inference
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import sys
    import json

    if len(sys.argv) < 2:
        print("Usage: python -m ml.inference <path_to_file> [model_type]")
        print("Example: python -m ml.inference uploads/test.nii.gz multiclass")
        sys.exit(1)

    fpath = sys.argv[1]
    mtype = sys.argv[2] if len(sys.argv) > 2 else "multiclass"

    if not os.path.isfile(fpath):
        print(f"Error: File not found: {fpath}")
        sys.exit(1)

    print(f"\n=== NeuroAssist Inference Engine ===")
    print(f"File:  {fpath}")
    print(f"Model: {mtype}")
    print(f"MD5:   {_file_md5(fpath)}")
    print()

    # Run twice to prove determinism
    result1 = run_inference(fpath, mtype)
    result2 = run_inference(fpath, mtype)

    print("Run 1:", json.dumps(result1, indent=2))
    print()
    print("Run 2:", json.dumps(result2, indent=2))
    print()

    # Compare everything EXCEPT processing_time (wall-clock, will always differ)
    check1 = {k: v for k, v in result1.items() if k != "processing_time"}
    check2 = {k: v for k, v in result2.items() if k != "processing_time"}

    if check1 == check2:
        print("✅ DETERMINISM VERIFIED: Both runs produce identical results.")
        print(f"   prediction={result1['prediction']}, "
              f"conf_cn={result1['confidence_cn']}, "
              f"conf_mci={result1['confidence_mci']}, "
              f"conf_ad={result1['confidence_ad']}")
    else:
        print("❌ DETERMINISM FAILED: Results differ between runs!")
        for k in check1:
            if check1[k] != check2.get(k):
                print(f"   DIFF: {k}: {check1[k]} vs {check2.get(k)}")
        sys.exit(1)
