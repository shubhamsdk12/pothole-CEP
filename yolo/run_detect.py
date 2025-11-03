from ultralytics import YOLO
import os
import sys

def detect_potholes(model_path, image_path, conf_threshold=0.25):
    """
    Run YOLOv8 detection on an image and return pothole stats.
    Args:
        model_path (str): Path to trained YOLO model (.pt file)
        image_path (str): Path to input image directory or file
        conf_threshold (float): Confidence threshold for detection

    Returns:
        dict: containing num_potholes and mean_confidence
    """

    # Load model
    model = YOLO(model_path)

    # Run prediction
    results = model.predict(
        source=image_path,
        conf=conf_threshold,
        save=True,
        verbose=True,
        project="test",
    )

    # Extract detections
    detections = results[0].boxes
    num_potholes = len(detections)

    if num_potholes > 0:
        confidences = detections.conf.cpu().numpy().tolist()
        mean_confidence = sum(confidences) / len(confidences)
        max_confidence = max(confidences)
    else:
        mean_confidence = 0.0
        max_confidence = 0.0

    # Print results
    print(f"Image / Image directory path: {os.path.basename(image_path)}")
    print(f"Potholes detected: {num_potholes}")
    print(f"Average confidence: {mean_confidence:.2f}")
    print(f"Maximum confidence: {max_confidence:.2f}")

    # Show annotated result image
    save_path = results[0].save_dir
    annotated_image = os.path.join(save_path, os.path.basename(image_path))
    print(f"📁 Annotated image saved at: {annotated_image}")

    return {
        "num_potholes": num_potholes,
        "mean_confidence": mean_confidence,
        "annotated_image": annotated_image
    }


if __name__ == "__main__":

    model_path = "./best.pt"
    if len(sys.argv) < 2:
        image_path = "./test/images/"
    else:
        image_path = sys.argv[1]

    detect_potholes(model_path, image_path)
