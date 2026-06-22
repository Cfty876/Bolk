import cv2
import os
import sys
import numpy as np
from ultralytics import YOLO
import imageio
from collections import defaultdict
from PIL import ImageFont, ImageDraw, Image

def put_text_ru(img, text, position, font_size=20, color=(255, 255, 255)):
    # Convert cv2 image to PIL image
    pil_img = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(pil_img)
    try:
        # Use Arial which supports Cyrillic
        font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    # Draw text
    draw.text(position, text, font=font, fill=color[::-1]) # RGB color for PIL
    # Convert back to cv2
    return cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

def detect_disease_spots(roi):
    """
    Эвристика: ищем белые/светлые пятна (подозрение на сапролегниоз/травмы чешуи).
    """
    if roi.size == 0:
        return False
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    # Define range for white/pale color
    lower_white = np.array([0, 0, 200], dtype=np.uint8)
    upper_white = np.array([180, 50, 255], dtype=np.uint8)
    mask = cv2.inRange(hsv, lower_white, upper_white)
    
    white_ratio = cv2.countNonZero(mask) / (roi.shape[0] * roi.shape[1])
    return white_ratio > 0.08 # If >8% of fish is white patches

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)
    video_path = os.path.join(project_root, "logo", "Sockeye Salmon _ Нерест лосося - Galina Angel (360p, h264).mp4")
    output_path = os.path.join(project_root, "public", "reports", "ai_demo.mp4")
    model_path = os.path.join(base_dir, "runs", "detect", "salmon_real_detector", "weights", "best.pt")

    alt_model_path = os.path.join(base_dir, "runs", "detect", "runs", "detect", "salmon_real_detector", "weights", "best.pt")
    if not os.path.exists(model_path) and os.path.exists(alt_model_path):
        model_path = alt_model_path

    if not os.path.exists(video_path):
        print(f"ОШИБКА: Видео не найдено {video_path}")
        return

    print(f"Загрузка модели из {model_path}...")
    model = YOLO(model_path)

    print(f"Открытие видео: {video_path}")
    cap = cv2.VideoCapture(video_path)
    
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    fps = cap.get(cv2.CAP_PROP_FPS)

    print(f"Запись в {output_path} (H.264)...")
    # Using imageio for direct H.264 browser compatibility
    writer = imageio.get_writer(output_path, fps=fps, codec='libx264', macro_block_size=None)

    # Load the new Sockeye model
    model = YOLO(r"runs\detect\runs\detect\sockeye_detector\weights\best.pt")
    
    # Store tracker history and crossed IDs
    track_history = defaultdict(lambda: [])
    crossed_up_ids = set()
    crossed_down_ids = set()
    
    frame_count = 0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"Открытие видео: {video_path}")
    print(f"Запись в {output_path} (H.264)...")
    
    # Define counting line coordinates (will be set based on first frame)
    line_y = None
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        height, width = frame.shape[:2]
        if line_y is None:
            line_y = int(height * 0.6) # Line at 60% of the screen height
            
        frame_count += 1
        
        # Run YOLO with tracking for Sockeye counting
        results = model.track(frame, persist=True, tracker="bytetrack.yaml", conf=0.15, iou=0.45, imgsz=640, verbose=False)
        
        annotated_frame = frame.copy()
        
        # Draw the virtual counting line
        cv2.line(annotated_frame, (0, line_y), (width, line_y), (0, 255, 255), 3) # Yellow line
        annotated_frame = put_text_ru(annotated_frame, "Линия учета", (10, line_y - 30), font_size=20, color=(0, 255, 255))
        
        if results[0].boxes is not None and results[0].boxes.id is not None:
            boxes = results[0].boxes.xyxy.cpu().numpy()
            track_ids = results[0].boxes.id.cpu().numpy()
            confs = results[0].boxes.conf.cpu().numpy()
            clss = results[0].boxes.cls.cpu().numpy()
            
            for box, track_id, conf, cls in zip(boxes, track_ids, confs, clss):
                x1, y1, x2, y2 = map(int, box)
                center_x = (x1 + x2) / 2
                center_y = (y1 + y2) / 2
                
                track = track_history[track_id]
                track.append((center_x, center_y))
                if len(track) > 30:
                    track.pop(0)
                
                # Check line crossing logic
                if len(track) >= 2:
                    prev_y = track[-2][1]
                    curr_y = track[-1][1]
                    
                    # Fish swimming UPSTREAM (bottom to top, so Y decreases)
                    if prev_y > line_y and curr_y <= line_y:
                        crossed_up_ids.add(track_id)
                    
                    # Fish swimming DOWNSTREAM (top to bottom, so Y increases)
                    if prev_y < line_y and curr_y >= line_y:
                        crossed_down_ids.add(track_id)
                
                # Draw box for Sockeye
                color = (0, 0, 255) # Red bounding box for Sockeye
                class_name = "Группа Нерок" if int(cls) == 1 else "Нерка"
                label = f"{class_name} #{int(track_id)}"
                
                # Highlight if just crossed
                if track_id in crossed_up_ids or track_id in crossed_down_ids:
                    color = (0, 255, 0) # Green if counted!
                    label = f"Учтена #{int(track_id)}"
                
                cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
                
                # Draw Russian text
                annotated_frame = put_text_ru(
                    annotated_frame, 
                    label, 
                    (x1, y1 - 25), 
                    font_size=18, 
                    color=color
                )
                
        # Draw statistics dashboard on top left
        dashboard_bg = annotated_frame[0:120, 0:400]
        # Darken dashboard area for text visibility
        annotated_frame[0:120, 0:400] = cv2.addWeighted(dashboard_bg, 0.5, np.zeros_like(dashboard_bg), 0.5, 0)
        
        annotated_frame = put_text_ru(annotated_frame, "Экологический Радар Камчатки", (20, 20), font_size=24, color=(255, 255, 255))
        annotated_frame = put_text_ru(annotated_frame, f"Вверх на нерест: {len(crossed_up_ids)}", (20, 55), font_size=20, color=(0, 255, 0))
        annotated_frame = put_text_ru(annotated_frame, f"Скат вниз: {len(crossed_down_ids)}", (20, 85), font_size=20, color=(0, 0, 255))

        # Convert BGR to RGB for imageio writer
        rgb_frame = cv2.cvtColor(annotated_frame, cv2.COLOR_BGR2RGB)
        writer.append_data(rgb_frame)
        
        if frame_count % 50 == 0:
            print(f"Обработано {frame_count}/{total_frames} кадров ({(frame_count/total_frames)*100:.1f}%)")

    cap.release()
    writer.close()
    
    print("\nОбработка успешно завершена!")

if __name__ == "__main__":
    main()
