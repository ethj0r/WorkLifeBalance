import io
import json
import base64
import logging
from contextlib import asynccontextmanager
from typing import List, Tuple, Optional

import cv2
import numpy as np
import pandas as pd
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from deepforest import main as deepforest_main

logger = logging.getLogger("forest_api")
logging.basicConfig(level=logging.INFO)
from fastapi.middleware.cors import CORSMiddleware



# ---------------------------------------------------------------------------
# Model lifecycle — load once, reuse across requests
# ---------------------------------------------------------------------------
class ModelHolder:
    """Container for the DeepForest model so we only load it once."""

    def __init__(self) -> None:
        self.model: Optional[deepforest_main.deepforest] = None

    def load(self) -> None:
        if self.model is not None:
            return
        logger.info("Loading DeepForest model 'weecology/deepforest-tree'...")
        m = deepforest_main.deepforest()
        m.load_model(model_name="weecology/deepforest-tree")
        try:
            m.model.eval()
        except AttributeError:
            pass
        self.model = m
        logger.info("DeepForest model loaded.")


model_holder = ModelHolder()


@asynccontextmanager
async def lifespan(app: FastAPI):
    model_holder.load()
    yield


app = FastAPI(
    title="Tree Counting API",
    description=(
        "Detects and counts trees inside a polygon returning an annotated image with centroids."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------
class TreeBox(BaseModel):
    x: int = Field(..., description="Centroid X (pixels)")
    y: int = Field(..., description="Centroid Y (pixels)")
    xmin: int
    ymin: int
    xmax: int
    ymax: int
    score: float = Field(..., description="Detector confidence in [0, 1]")


class CountResponse(BaseModel):
    tree_count: int
    # trees: List[TreeBox]
    annotated_image_base64: str = Field(
        ..., description="Base64-encoded PNG of the annotated image"
    )


# ---------------------------------------------------------------------------
# Detection
# ---------------------------------------------------------------------------
# DeepForest's release model was trained on 400x400 crops; for anything larger
# we should use predict_tile so internal sliding windows + NMS handle it.
TILE_THRESHOLD_PX = 400
PATCH_SIZE = 400
PATCH_OVERLAP = 0.25
DEFAULT_SCORE_THRESHOLD = 0.30


def _run_deepforest(image_rgb: np.ndarray, score_threshold: float) -> pd.DataFrame:
    """
    Run DeepForest on the full image (not just the polygon crop — cropping
    introduces edge artifacts and the model uses surrounding context).
    Picks predict_image vs predict_tile based on image size.
    """
    model = model_holder.model
    if model is None:
        raise RuntimeError("DeepForest model is not loaded.")

    # Configure score threshold on the underlying detector when supported.
    try:
        model.config["score_thresh"] = float(score_threshold)
    except Exception:
        pass

    h, w = image_rgb.shape[:2]
    # DeepForest expects float32, 0-255, RGB.
    img_f = image_rgb.astype(np.float32)

    if max(h, w) > TILE_THRESHOLD_PX:
        boxes = model.predict_tile(
            image=img_f,
            patch_size=PATCH_SIZE,
            patch_overlap=PATCH_OVERLAP,
        )
    else:
        boxes = model.predict_image(image=img_f)

    if boxes is None or len(boxes) == 0:
        return pd.DataFrame(columns=["xmin", "ymin", "xmax", "ymax", "label", "score"])

    needed = ["xmin", "ymin", "xmax", "ymax", "score"]
    for col in needed:
        if col not in boxes.columns:
            raise RuntimeError(
                f"DeepForest result is missing column '{col}'. "
                f"Got columns: {list(boxes.columns)}"
            )

    # Apply score threshold defensively (predict_tile in some versions ignores
    # config["score_thresh"]).
    boxes = boxes[boxes["score"] >= score_threshold].reset_index(drop=True)
    return boxes


def _filter_boxes_by_polygon(
    boxes: pd.DataFrame, polygon: np.ndarray
) -> pd.DataFrame:
    """Keep only boxes whose centroid lies inside (or on) the polygon."""
    if boxes.empty:
        out = boxes.copy()
        out["cx"] = pd.Series(dtype=int)
        out["cy"] = pd.Series(dtype=int)
        return out

    cx = (boxes["xmin"] + boxes["xmax"]) / 2.0
    cy = (boxes["ymin"] + boxes["ymax"]) / 2.0

    poly_int = polygon.astype(np.int32)
    inside_mask = np.array(
        [
            cv2.pointPolygonTest(poly_int, (float(x), float(y)), False) >= 0
            for x, y in zip(cx.values, cy.values)
        ],
        dtype=bool,
    )

    out = boxes.loc[inside_mask].copy()
    out["cx"] = cx[inside_mask].round().astype(int).values
    out["cy"] = cy[inside_mask].round().astype(int).values
    return out.reset_index(drop=True)


# ---------------------------------------------------------------------------
# Annotation
# ---------------------------------------------------------------------------
def annotate_image(
    image_bgr: np.ndarray,
    polygon: np.ndarray,
    boxes_in: pd.DataFrame,
) -> np.ndarray:
    annotated = image_bgr.copy()

    # Polygon outline (yellow)
    cv2.polylines(
        annotated,
        [polygon.astype(np.int32)],
        isClosed=True,
        color=(0, 255, 255),
        thickness=2,
    )

    # Boxes + centroids
    for _, row in boxes_in.iterrows():
        x1, y1, x2, y2 = (
            int(row["xmin"]),
            int(row["ymin"]),
            int(row["xmax"]),
            int(row["ymax"]),
        )
        cx, cy = int(row["cx"]), int(row["cy"])

        cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 220, 0), 1)
        cv2.circle(annotated, (cx, cy), 5, (255, 255, 255), -1)
        cv2.circle(annotated, (cx, cy), 3, (0, 0, 255), -1)

    label = f"Trees: {len(boxes_in)}"
    (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.9, 2)
    cv2.rectangle(annotated, (8, 8), (8 + tw + 12, 8 + th + 14), (0, 0, 0), -1)
    cv2.putText(
        annotated,
        label,
        (14, 8 + th + 6),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.9,
        (0, 255, 255),
        2,
        cv2.LINE_AA,
    )
    return annotated


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _parse_polygon(polygon_raw: str, img_shape: Tuple[int, int]) -> np.ndarray:
    try:
        pts = json.loads(polygon_raw)
    except json.JSONDecodeError as e:
        raise HTTPException(400, f"polygon must be valid JSON, got: {e.msg}")

    if not isinstance(pts, list) or len(pts) < 3:
        raise HTTPException(400, "polygon must be a list of at least 3 [x, y] points.")

    arr = np.array(pts, dtype=np.float32)
    if arr.ndim != 2 or arr.shape[1] != 2:
        raise HTTPException(400, "Each polygon point must be a pair [x, y].")

    h, w = img_shape
    arr[:, 0] = np.clip(arr[:, 0], 0, w - 1)
    arr[:, 1] = np.clip(arr[:, 1], 0, h - 1)
    return arr


def _decode_image(file_bytes: bytes) -> np.ndarray:
    """Returns BGR uint8."""
    arr = np.frombuffer(file_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(400, "Could not decode image. Use a valid JPG/PNG/TIFF file.")
    return img


def _validate_score_threshold(value: float) -> float:
    if not (0.0 <= value <= 1.0):
        raise HTTPException(400, "score_threshold must be between 0 and 1.")
    return value


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model_holder.model is not None,
        "model_name": "weecology/deepforest-tree",
    }


@app.post(
    "/count-trees",
    response_model=CountResponse,
    summary="Count trees inside a polygon and return JSON with annotated image",
)
async def count_trees(
    image: UploadFile = File(..., description="Top-down forest image (JPG/PNG/TIFF)"),
    polygon: str = Form(
        ...,
        description='JSON list of points, e.g. "[[100,100],[400,120],[380,400],[120,380]]"',
    ),
    score_threshold: float = Form(
        DEFAULT_SCORE_THRESHOLD,
        description="Minimum detector confidence in [0, 1]. Default 0.3.",
    ),
):
    score_threshold = _validate_score_threshold(score_threshold)

    image_bytes = await image.read()
    img_bgr = _decode_image(image_bytes)
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    polygon_pts = _parse_polygon(polygon, img_bgr.shape[:2])

    all_boxes = _run_deepforest(img_rgb, score_threshold)
    boxes_in = _filter_boxes_by_polygon(all_boxes, polygon_pts)

    annotated = annotate_image(img_bgr, polygon_pts, boxes_in)
    ok, png_buf = cv2.imencode(".png", annotated)
    if not ok:
        raise HTTPException(500, "Failed to encode result image.")

    trees = [
        TreeBox(
            x=int(row["cx"]),
            y=int(row["cy"]),
            xmin=int(row["xmin"]),
            ymin=int(row["ymin"]),
            xmax=int(row["xmax"]),
            ymax=int(row["ymax"]),
            score=float(row["score"]),
        )
        for _, row in boxes_in.iterrows()
    ]

    return CountResponse(
        tree_count=len(trees),
        # trees=trees,
        annotated_image_base64=base64.b64encode(png_buf.tobytes()).decode("ascii"),
    )


@app.post(
    "/count-trees/image",
    summary="Same as /count-trees but returns the annotated PNG directly",
)
async def count_trees_image(
    image: UploadFile = File(...),
    polygon: str = Form(...),
    score_threshold: float = Form(DEFAULT_SCORE_THRESHOLD),
):
    score_threshold = _validate_score_threshold(score_threshold)

    image_bytes = await image.read()
    img_bgr = _decode_image(image_bytes)
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    polygon_pts = _parse_polygon(polygon, img_bgr.shape[:2])

    all_boxes = _run_deepforest(img_rgb, score_threshold)
    boxes_in = _filter_boxes_by_polygon(all_boxes, polygon_pts)
    annotated = annotate_image(img_bgr, polygon_pts, boxes_in)

    ok, png_buf = cv2.imencode(".png", annotated)
    if not ok:
        raise HTTPException(500, "Failed to encode result image.")

    return StreamingResponse(
        io.BytesIO(png_buf.tobytes()),
        media_type="image/png",
        headers={"X-Tree-Count": str(len(boxes_in))},
    )

# from fastapi import FastAPI, UploadFile, File, Form, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# import numpy as np
# import cv2
# import json
# import base64
# import tempfile
# from pathlib import Path

# from deepforest import main


# app = FastAPI(title="Tree Detection API with DeepForest")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# # Load model once when the API starts
# model = main.deepforest()
# model.load_model(model_name="weecology/deepforest-tree")
# # model.model.to("cuda")

# @app.get("/")
# def root():
#     return {
#         "message": "api-detection is running",
#         "model": "DeepForest pretrained tree crown detector"
#     }


# @app.post("/detect-trees")
# async def detect_trees(
#     image: UploadFile = File(...),
#     polygon: str = Form(...),
#     score_threshold: float = Form(0.3)
# ):
#     """
#     Receives:
#     - image: top-down forest image
#     - polygon: JSON string, example:
#       [[100,100],[500,100],[500,500],[100,500]]
#     - score_threshold: optional confidence threshold

#     Returns:
#     - tree_count
#     - centroid coordinates
#     - bounding boxes
#     - annotated image as base64
#     """

#     try:
#         polygon_points = np.array(json.loads(polygon), dtype=np.int32)
#     except Exception:
#         raise HTTPException(
#             status_code=400,
#             detail="Invalid polygon. Use JSON format like [[100,100],[500,100],[500,500],[100,500]]"
#         )

#     if polygon_points.ndim != 2 or polygon_points.shape[1] != 2:
#         raise HTTPException(
#             status_code=400,
#             detail="Polygon must be an array of [x,y] points."
#         )

#     contents = await image.read()

#     np_arr = np.frombuffer(contents, np.uint8)
#     img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

#     if img_bgr is None:
#         raise HTTPException(status_code=400, detail="Invalid image file.")

#     annotated = img_bgr.copy()

#     # DeepForest works with image file paths reliably.
#     # Save uploaded image to a temporary file.
#     suffix = Path(image.filename or "upload.jpg").suffix or ".jpg"

#     with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
#         temp_file.write(contents)
#         temp_path = temp_file.name

#     try:
#         predictions = model.predict_tile(
#             path=temp_path,
#             patch_size=800,
#             patch_overlap=0.25
#         )
#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"DeepForest prediction failed: {str(e)}"
#         )

#     # Draw requested polygon
#     cv2.polylines(
#         annotated,
#         [polygon_points],
#         isClosed=True,
#         color=(255, 0, 0),
#         thickness=3
#     )

#     tree_centroids = []
#     tree_boxes = []

#     if predictions is not None and len(predictions) > 0:
#         for _, row in predictions.iterrows():
#             score = float(row.get("score", row.get("scores", 1.0)))

#             if score < score_threshold:
#                 continue

#             xmin = int(row["xmin"])
#             ymin = int(row["ymin"])
#             xmax = int(row["xmax"])
#             ymax = int(row["ymax"])

#             cx = int((xmin + xmax) / 2)
#             cy = int((ymin + ymax) / 2)

#             # Count only trees whose centroid is inside polygon
#             inside = cv2.pointPolygonTest(
#                 polygon_points,
#                 (cx, cy),
#                 False
#             )

#             if inside < 0:
#                 continue

#             tree_number = len(tree_centroids) + 1

#             tree_centroids.append({
#                 "id": tree_number,
#                 "x": cx,
#                 "y": cy,
#                 "score": score
#             })

#             tree_boxes.append({
#                 "id": tree_number,
#                 "xmin": xmin,
#                 "ymin": ymin,
#                 "xmax": xmax,
#                 "ymax": ymax,
#                 "score": score
#             })

#             # Draw bounding box
#             cv2.rectangle(
#                 annotated,
#                 (xmin, ymin),
#                 (xmax, ymax),
#                 (0, 255, 0),
#                 2
#             )

#             # Draw centroid
#             cv2.circle(
#                 annotated,
#                 (cx, cy),
#                 6,
#                 (0, 0, 255),
#                 -1
#             )

#             # Draw tree number
#             cv2.putText(
#                 annotated,
#                 str(tree_number),
#                 (cx + 8, cy - 8),
#                 cv2.FONT_HERSHEY_SIMPLEX,
#                 0.6,
#                 (0, 0, 255),
#                 2
#             )

#     success, buffer = cv2.imencode(".jpg", annotated)

#     if not success:
#         raise HTTPException(
#             status_code=500,
#             detail="Failed to encode annotated image."
#         )

#     annotated_base64 = base64.b64encode(buffer).decode("utf-8")

#     return {
#         "tree_count": len(tree_centroids),
#         "annotated_image_base64": annotated_base64
#     }