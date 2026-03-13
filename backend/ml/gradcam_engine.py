"""
NeuroAssist — Simulated Grad-CAM Heatmap Engine
================================================
Generates anatomically-informed 3D attention heatmaps and
renders them as 2D slice PNG images (axial, coronal, sagittal).

Uses Gaussian blobs placed at real brain region coordinates.
No PyTorch, NiBabel, or OpenCV required — uses pure numpy + Pillow.
"""

import numpy as np
import os
import json
from pathlib import Path


def generate_brain_heatmap_slices(
    scan_id: str,
    prediction_class: int,
    brain_regions: dict,
    output_dir: str = "uploads/gradcam",
    volume_shape: tuple = (128, 128, 128),
) -> dict:
    """
    Generate 3 canonical slice view PNG images with heatmap overlay.

    Parameters
    ----------
    scan_id : str
        Unique scan identifier (e.g. 'SCN-A3F2B1')
    prediction_class : int
        0=CN, 1=MCI, 2=AD
    brain_regions : dict
        Region name → attention score (0-1) from inference engine
    output_dir : str
        Directory to save slice PNGs
    volume_shape : tuple
        Simulated brain volume dimensions

    Returns
    -------
    dict with 'slice_paths' and 'region_scores'
    """
    os.makedirs(output_dir, exist_ok=True)

    # Generate simulated 3D brain volume (grayscale)
    brain_volume = _generate_brain_volume(volume_shape)

    # Generate 3D Grad-CAM heatmap
    cam_3d = _generate_gradcam_volume(volume_shape, prediction_class, brain_regions)

    # Extract middle slices
    cx, cy, cz = volume_shape[0] // 2, volume_shape[1] // 2, volume_shape[2] // 2

    slices = {
        "axial": (brain_volume[:, :, cz], cam_3d[:, :, cz]),
        "coronal": (brain_volume[:, cy, :], cam_3d[:, cy, :]),
        "sagittal": (brain_volume[cx, :, :], cam_3d[cx, :, :]),
    }

    output_paths = {}
    for view_name, (brain_slice, cam_slice) in slices.items():
        output_path = os.path.join(output_dir, f"{scan_id}_{view_name}.png")
        _render_heatmap_overlay(brain_slice, cam_slice, output_path)
        output_paths[view_name] = output_path

    return {
        "slice_paths": output_paths,
        "region_scores": brain_regions,
    }


def _generate_brain_volume(shape: tuple) -> np.ndarray:
    """
    Generate a simulated brain volume — an ellipsoidal shape
    with some internal structure for realistic slice rendering.
    """
    vol = np.zeros(shape, dtype=np.float32)
    cx, cy, cz = shape[0] // 2, shape[1] // 2, shape[2] // 2

    X, Y, Z = np.mgrid[0:shape[0], 0:shape[1], 0:shape[2]]

    # Main brain ellipsoid
    rx, ry, rz = shape[0] * 0.40, shape[1] * 0.35, shape[2] * 0.42
    brain_mask = ((X - cx) ** 2 / rx ** 2 +
                  (Y - cy) ** 2 / ry ** 2 +
                  (Z - cz) ** 2 / rz ** 2) <= 1.0
    vol[brain_mask] = 0.6

    # Core (ventricles) — darker region inside
    rx2, ry2, rz2 = shape[0] * 0.12, shape[1] * 0.10, shape[2] * 0.15
    vent_mask = ((X - cx) ** 2 / rx2 ** 2 +
                 (Y - cy) ** 2 / ry2 ** 2 +
                 (Z - cz) ** 2 / rz2 ** 2) <= 1.0
    vol[vent_mask] = 0.25

    # Cortical rim — brighter outer shell
    rx3, ry3, rz3 = shape[0] * 0.38, shape[1] * 0.33, shape[2] * 0.40
    cortex_mask = (brain_mask &
                   ~(((X - cx) ** 2 / rx3 ** 2 +
                      (Y - cy) ** 2 / ry3 ** 2 +
                      (Z - cz) ** 2 / rz3 ** 2) <= 1.0))
    vol[cortex_mask] = 0.75

    # Add subtle noise for realism
    noise = np.random.RandomState(42).normal(0, 0.03, shape).astype(np.float32)
    vol = np.clip(vol + noise, 0, 1)

    return vol


def _generate_gradcam_volume(shape: tuple, prediction_class: int,
                             brain_regions: dict) -> np.ndarray:
    """
    Generate a 3D Grad-CAM volume using Gaussian blobs at
    anatomically correct brain region positions.
    """
    cam = np.zeros(shape, dtype=np.float32)

    # Anatomical region center positions (relative to volume shape)
    region_positions = {
        "hippocampus": [
            (0.50, 0.35, 0.42),   # left hippocampus
            (0.50, 0.65, 0.42),   # right hippocampus
        ],
        "entorhinal_cortex": [
            (0.47, 0.32, 0.47),   # left entorhinal
            (0.47, 0.68, 0.47),   # right entorhinal
        ],
        "temporal_lobe": [
            (0.45, 0.25, 0.45),   # left temporal
            (0.45, 0.75, 0.45),   # right temporal
        ],
        "parietal_cortex": [
            (0.35, 0.50, 0.65),   # superior parietal
        ],
        "frontal_lobe": [
            (0.30, 0.50, 0.70),   # frontal center
            (0.30, 0.35, 0.65),   # left frontal
            (0.30, 0.65, 0.65),   # right frontal
        ],
        "cerebellum": [
            (0.70, 0.50, 0.25),   # cerebellum center
        ],
    }

    for region_name, positions in region_positions.items():
        score = brain_regions.get(region_name, 0.0)
        if score < 0.05:
            continue

        # Sigma scales with prediction severity
        base_sigma = 8 + prediction_class * 3

        for rel_pos in positions:
            abs_x = int(rel_pos[0] * shape[0])
            abs_y = int(rel_pos[1] * shape[1])
            abs_z = int(rel_pos[2] * shape[2])
            _add_gaussian_blob(cam, abs_x, abs_y, abs_z,
                               intensity=score, sigma=base_sigma)

    # Normalize to 0-1
    if cam.max() > 0:
        cam = cam / cam.max()

    return cam


def _add_gaussian_blob(volume: np.ndarray, x: int, y: int, z: int,
                       intensity: float, sigma: float):
    """Add a 3D Gaussian blob at position (x, y, z) efficiently."""
    s = volume.shape
    # Compute bounding box (3*sigma covers 99.7% of the Gaussian)
    r = int(3 * sigma)
    x0, x1 = max(0, x - r), min(s[0], x + r + 1)
    y0, y1 = max(0, y - r), min(s[1], y + r + 1)
    z0, z1 = max(0, z - r), min(s[2], z + r + 1)

    if x0 >= x1 or y0 >= y1 or z0 >= z1:
        return

    X, Y, Z = np.mgrid[x0:x1, y0:y1, z0:z1]
    dist_sq = (X - x) ** 2 + (Y - y) ** 2 + (Z - z) ** 2
    blob = intensity * np.exp(-dist_sq / (2 * sigma ** 2))
    volume[x0:x1, y0:y1, z0:z1] += blob


def _render_heatmap_overlay(brain_slice: np.ndarray, cam_slice: np.ndarray,
                            output_path: str, alpha: float = 0.5):
    """
    Render a 2D brain slice with heatmap color overlay and save as PNG.
    Uses pure numpy + Pillow (PIL) — no OpenCV dependency.
    """
    from PIL import Image

    h, w = brain_slice.shape

    # Resize both to 512x512 using PIL
    brain_img = Image.fromarray((brain_slice * 255).astype(np.uint8), mode="L")
    cam_img_gray = Image.fromarray((cam_slice * 255).astype(np.uint8), mode="L")

    size = (512, 512)
    brain_img = brain_img.resize(size, Image.Resampling.BILINEAR)
    cam_img_gray = cam_img_gray.resize(size, Image.Resampling.BILINEAR)

    # Convert brain to RGB
    brain_rgb = np.stack([np.array(brain_img)] * 3, axis=-1)

    # Apply JET-like colormap to heatmap
    cam_arr = np.array(cam_img_gray).astype(np.float32) / 255.0
    heatmap_rgb = _apply_jet_colormap(cam_arr)

    # Overlay: blend brain and heatmap
    overlay = (brain_rgb.astype(np.float32) * (1 - alpha) +
               heatmap_rgb.astype(np.float32) * alpha)
    overlay = np.clip(overlay, 0, 255).astype(np.uint8)

    # Add subtle border
    overlay[0:3, :, :] = [0, 40, 80]
    overlay[-3:, :, :] = [0, 40, 80]
    overlay[:, 0:3, :] = [0, 40, 80]
    overlay[:, -3:, :] = [0, 40, 80]

    result = Image.fromarray(overlay, mode="RGB")
    result.save(output_path, "PNG")


def _apply_jet_colormap(values: np.ndarray) -> np.ndarray:
    """
    Apply a JET-like colormap (blue → cyan → green → yellow → red)
    to a 2D array of values in [0, 1].
    Returns an (H, W, 3) uint8 array.
    """
    # Piecewise linear JET colormap
    v = np.clip(values, 0, 1)

    r = np.clip(1.5 - np.abs(v * 4 - 3), 0, 1)
    g = np.clip(1.5 - np.abs(v * 4 - 2), 0, 1)
    b = np.clip(1.5 - np.abs(v * 4 - 1), 0, 1)

    rgb = np.stack([r, g, b], axis=-1)
    return (rgb * 255).astype(np.uint8)


# ---------------------------------------------------------------------------
# Self-test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("Generating test Grad-CAM heatmaps...")

    test_regions = {
        "hippocampus": 0.92,
        "entorhinal_cortex": 0.78,
        "temporal_lobe": 0.65,
        "parietal_cortex": 0.45,
        "frontal_lobe": 0.28,
        "cerebellum": 0.12,
    }

    result = generate_brain_heatmap_slices(
        scan_id="SCN-TEST01",
        prediction_class=2,  # AD
        brain_regions=test_regions,
        output_dir="uploads/gradcam",
    )

    print(f"\nGenerated slice images:")
    for view, path in result["slice_paths"].items():
        exists = os.path.isfile(path)
        size_kb = os.path.getsize(path) / 1024 if exists else 0
        print(f"  {view}: {path} ({'✅' if exists else '❌'}, {size_kb:.1f} KB)")

    print(f"\nRegion scores: {json.dumps(result['region_scores'], indent=2)}")
    print("\n✅ Grad-CAM engine test complete.")
