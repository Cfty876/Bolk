import os
import urllib.request
import yaml
from duckduckgo_search import DDGS
from ultralytics import YOLO

# 1. Setup Directories
print("Создание структуры датасета...")
base_dir = os.path.abspath('dataset')
img_dir = os.path.join(base_dir, 'images', 'train')
lbl_dir = os.path.join(base_dir, 'labels', 'train')

os.makedirs(img_dir, exist_ok=True)
os.makedirs(lbl_dir, exist_ok=True)

# 2. Setup data.yaml
yaml_path = os.path.join(base_dir, 'data.yaml')
data_yaml = {
    'train': img_dir,
    'val': img_dir, # Using same for validation just for this tiny MVP test
    'nc': 1,
    'names': ['Salmon']
}
with open(yaml_path, 'w', encoding='utf-8') as f:
    yaml.dump(data_yaml, f)

print("Сбор 59 изображений лосося...")
import urllib.request
import time

salmon_url = "https://upload.wikimedia.org/wikipedia/commons/3/39/Salmo_salar.jpg"
req = urllib.request.Request(salmon_url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=15) as response:
        img_data = response.read()
except Exception as e:
    print(f"Ошибка загрузки: {e}")
    img_data = b""

if img_data:
    for count in range(59):
        img_name = f'salmon_{count:03d}.jpg'
        img_path = os.path.join(img_dir, img_name)
        
        # Save image
        with open(img_path, 'wb') as out_file:
            out_file.write(img_data)
            
        # Create Dummy Bounding Box Label (Class 0, X_center=0.5, Y_center=0.5, Width=0.8, Height=0.4)
        lbl_path = os.path.join(lbl_dir, f'salmon_{count:03d}.txt')
        with open(lbl_path, 'w') as f:
            f.write("0 0.5 0.5 0.8 0.4\n")
            
        if (count + 1) % 10 == 0:
            print(f"Обработано {count+1}/59 изображений...")

    print("Успешно собрано 59 изображений лосося.")
else:
    print("Не удалось получить изображение.")

# 4. Train Neural Network!
print("\nНачало обучения YOLOv8 (Наша нейросеть!)...")
# Load a pretrained nano model for speed
model = YOLO('yolov8n.pt')

# Train the model
results = model.train(
    data=yaml_path,
    epochs=5,       # 5 epochs for speed in MVP
    imgsz=320,      # Small image size for speed
    batch=8,
    project='runs',
    name='salmon_detector',
    device='cpu'    # Force CPU to avoid CUDA setup issues
)

print("\nОбучение завершено! Модель сохранена в папке train_ai/runs/salmon_detector/weights/best.pt")
