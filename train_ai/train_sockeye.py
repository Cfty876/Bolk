import os
import yaml
from ultralytics import YOLO

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_dir = os.path.join(base_dir, "true_sockeye_dataset")
    yaml_path = os.path.join(dataset_dir, "data.yaml")
    
    if not os.path.exists(yaml_path):
        print(f"ОШИБКА: data.yaml не найден в {dataset_dir}!")
        return

    print("\nНачинаем обучение ИИ для подсчета Нерки (Sockeye) на нересте!")
    os.environ['KMP_DUPLICATE_LIB_OK'] = 'True'
    
    model = YOLO("yolov8n.pt") # Base nano model
    
    # We run training with heavy color augmentations to ensure the model 
    # perfectly generalizes to the Sockeye's bright red color variations in wild rivers
    results = model.train(
        data=yaml_path,
        epochs=10,        # 10 epochs for fast iteration
        imgsz=320,        # Fast training
        project="runs/detect",
        name="sockeye_detector",
        exist_ok=True,
        hsv_h=0.5,        # Heavy hue augmentation
        hsv_s=0.5,        # Heavy saturation augmentation
        hsv_v=0.5         # Heavy brightness augmentation
    )
    
    print("\nУра! Экологическая модель Sockeye-сканера успешно обучена.")
    print("Сохранено в: train_ai/runs/detect/sockeye_detector/weights/best.pt")

if __name__ == "__main__":
    main()
