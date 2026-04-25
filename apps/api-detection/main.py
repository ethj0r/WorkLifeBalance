from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import cv2
import json
import base64
import tempfile
from pathlib import Path

from deepforest import main


app = FastAPI(title="Tree Detection API with DeepForest")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Load model once when the API starts
model = main.deepforest()
model.load_model(model_name="weecology/deepforest-tree")
# model.model.to("cuda")

@app.get("/")
def root():
    return {
        "message": "api-detection is running",
        "model": "DeepForest pretrained tree crown detector"
    }


@app.post("/detect-trees")
async def detect_trees(
    image: UploadFile = File(...),
    polygon: str = Form(...),
    score_threshold: float = Form(0.3)
):
    """
    Receives:
    - image: top-down forest image
    - polygon: JSON string, example:
      [[100,100],[500,100],[500,500],[100,500]]
    - score_threshold: optional confidence threshold

    Returns:
    - tree_count
    - centroid coordinates
    - bounding boxes
    - annotated image as base64
    """

    try:
        polygon_points = np.array(json.loads(polygon), dtype=np.int32)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid polygon. Use JSON format like [[100,100],[500,100],[500,500],[100,500]]"
        )

    if polygon_points.ndim != 2 or polygon_points.shape[1] != 2:
        raise HTTPException(
            status_code=400,
            detail="Polygon must be an array of [x,y] points."
        )

    contents = await image.read()

    np_arr = np.frombuffer(contents, np.uint8)
    img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        raise HTTPException(status_code=400, detail="Invalid image file.")

    annotated = img_bgr.copy()

    # DeepForest works with image file paths reliably.
    # Save uploaded image to a temporary file.
    suffix = Path(image.filename or "upload.jpg").suffix or ".jpg"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_file.write(contents)
        temp_path = temp_file.name

    try:
        predictions = model.predict_tile(
            path=temp_path,
            patch_size=400,
            patch_overlap=0.25
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"DeepForest prediction failed: {str(e)}"
        )

    # Draw requested polygon
    cv2.polylines(
        annotated,
        [polygon_points],
        isClosed=True,
        color=(255, 0, 0),
        thickness=3
    )

    tree_centroids = []
    tree_boxes = []

    if predictions is not None and len(predictions) > 0:
        for _, row in predictions.iterrows():
            score = float(row.get("score", row.get("scores", 1.0)))

            if score < score_threshold:
                continue

            xmin = int(row["xmin"])
            ymin = int(row["ymin"])
            xmax = int(row["xmax"])
            ymax = int(row["ymax"])

            cx = int((xmin + xmax) / 2)
            cy = int((ymin + ymax) / 2)

            # Count only trees whose centroid is inside polygon
            inside = cv2.pointPolygonTest(
                polygon_points,
                (cx, cy),
                False
            )

            if inside < 0:
                continue

            tree_number = len(tree_centroids) + 1

            tree_centroids.append({
                "id": tree_number,
                "x": cx,
                "y": cy,
                "score": score
            })

            tree_boxes.append({
                "id": tree_number,
                "xmin": xmin,
                "ymin": ymin,
                "xmax": xmax,
                "ymax": ymax,
                "score": score
            })

            # Draw bounding box
            cv2.rectangle(
                annotated,
                (xmin, ymin),
                (xmax, ymax),
                (0, 255, 0),
                2
            )

            # Draw centroid
            cv2.circle(
                annotated,
                (cx, cy),
                6,
                (0, 0, 255),
                -1
            )

            # Draw tree number
            cv2.putText(
                annotated,
                str(tree_number),
                (cx + 8, cy - 8),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 0, 255),
                2
            )

    success, buffer = cv2.imencode(".jpg", annotated)

    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to encode annotated image."
        )

    annotated_base64 = base64.b64encode(buffer).decode("utf-8")

    return {
        "tree_count": len(tree_centroids),
        "annotated_image_base64": annotated_base64
    }