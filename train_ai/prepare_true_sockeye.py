import os
import zipfile
import yaml
import shutil

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    zip_path = os.path.join(base_dir, "sockeye.v1i.yolov8.zip")
    dataset_dir = os.path.join(base_dir, "true_sockeye_dataset")
    
    if not os.path.exists(zip_path):
        print(f"ОШИБКА: Архив не найден по пути: {zip_path}")
        return
        
    print(f"Распаковка {zip_path} в {dataset_dir}...")
    if os.path.exists(dataset_dir):
        shutil.rmtree(dataset_dir)
    os.makedirs(dataset_dir, exist_ok=True)
    
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(dataset_dir)
        
    print("Распаковка завершена. Исправляем data.yaml...")
    yaml_path = os.path.join(dataset_dir, "data.yaml")
    
    if os.path.exists(yaml_path):
        with open(yaml_path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
            
        # Fix paths to be absolute
        if 'train' in data:
            data['train'] = os.path.join(dataset_dir, "train", "images") if os.path.exists(os.path.join(dataset_dir, "train", "images")) else os.path.join(dataset_dir, data['train'].replace('../', ''))
        if 'val' in data:
            data['val'] = os.path.join(dataset_dir, "valid", "images") if os.path.exists(os.path.join(dataset_dir, "valid", "images")) else os.path.join(dataset_dir, data['val'].replace('../', ''))
        if 'test' in data:
            data['test'] = os.path.join(dataset_dir, "test", "images") if os.path.exists(os.path.join(dataset_dir, "test", "images")) else os.path.join(dataset_dir, data['test'].replace('../', ''))
            
        with open(yaml_path, 'w', encoding='utf-8') as f:
            yaml.dump(data, f)
        print("data.yaml успешно обновлен абсолютными путями.")
    else:
        print("ВНИМАНИЕ: data.yaml не найден в корне датасета. Возможно, структура архива другая.")
        
if __name__ == "__main__":
    main()
