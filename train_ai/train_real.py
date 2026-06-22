import os
import zipfile
import yaml
from ultralytics import YOLO

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    zip_path = os.path.join(base_dir, "Salmon.v2i.yolov8.zip")
    dataset_dir = os.path.join(base_dir, "real_dataset")
    
    # 1. Unzip the dataset
    if not os.path.exists(dataset_dir):
        print(f"Распаковка архива {zip_path}...")
        os.makedirs(dataset_dir, exist_ok=True)
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(dataset_dir)
        print("Распаковка завершена!")
    else:
        print("Датасет уже распакован.")
        
    # 2. Fix data.yaml paths
    yaml_path = os.path.join(dataset_dir, "data.yaml")
    if os.path.exists(yaml_path):
        with open(yaml_path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
            
        print("Оригинальный data.yaml:")
        print(data)
        
        # Roboflow usually sets train: ../train/images
        # We need to change it to absolute paths to prevent YOLO errors
        if 'train' in data:
            # If path contains '..', replace it or just point it directly
            # Roboflow format: train: ../train/images
            data['train'] = os.path.join(dataset_dir, "train", "images") if os.path.exists(os.path.join(dataset_dir, "train", "images")) else os.path.join(dataset_dir, data['train'].replace('../', ''))
        
        if 'val' in data:
            data['val'] = os.path.join(dataset_dir, "valid", "images") if os.path.exists(os.path.join(dataset_dir, "valid", "images")) else os.path.join(dataset_dir, data['val'].replace('../', ''))
            
        if 'test' in data:
            data['test'] = os.path.join(dataset_dir, "test", "images") if os.path.exists(os.path.join(dataset_dir, "test", "images")) else os.path.join(dataset_dir, data['test'].replace('../', ''))
            
        with open(yaml_path, 'w', encoding='utf-8') as f:
            yaml.dump(data, f)
            
        print("Исправленный data.yaml (абсолютные пути):")
        print(data)
    else:
        print(f"ОШИБКА: data.yaml не найден в {dataset_dir}!")
        return

    # 3. Train YOLO
    print("\nНачинаем настоящее обучение YOLOv8!")
    os.environ['KMP_DUPLICATE_LIB_OK'] = 'True' # Fix for silent crashes on Windows
    model = YOLO("yolov8n.pt") # Base nano model
    
    # We will run for 30 epochs. CPU training might take some time, but it's worth it for a real dataset!
    results = model.train(
        data=yaml_path,
        epochs=30,
        imgsz=320, # Reduced to prevent OOM
        project="runs/detect",
        name="salmon_real_detector",
        exist_ok=True
    )
    
    print("\nУра! Обучение на настоящем датасете успешно завершено.")
    print("Ваша мощная модель сохранена в: train_ai/runs/detect/salmon_real_detector/weights/best.pt")

if __name__ == "__main__":
    main()
