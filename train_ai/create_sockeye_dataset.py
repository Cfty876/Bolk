import cv2
import os
import shutil
import numpy as np

def shift_hue_to_red(image_path, output_path):
    # Read image
    img = cv2.imread(image_path)
    if img is None:
        return
    
    # Convert to HSV
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    
    # In HSV, Red is around 0-10 and 160-180.
    # Atlantic salmon are mostly silver/grey (low saturation).
    # We will boost the saturation and shift the hue towards red for all pixels 
    # that are not too bright or too dark, simulating the red body of sockeye.
    
    h, s, v = cv2.split(hsv)
    
    # Create a mask for "fish-like" pixels (mid-brightness, low-ish saturation)
    mask = cv2.inRange(hsv, (0, 0, 40), (180, 150, 220))
    
    # Shift hue to red (around 5)
    h[mask > 0] = 5
    # Boost saturation significantly to make it bright red
    s[mask > 0] = np.clip(s[mask > 0] + 100, 0, 255)
    
    # Merge back and convert to BGR
    hsv_new = cv2.merge([h, s, v])
    res = cv2.cvtColor(hsv_new, cv2.COLOR_HSV2BGR)
    
    cv2.imwrite(output_path, res)

def convert_dataset(src_dir, dst_dir):
    if not os.path.exists(src_dir):
        print(f"Source {src_dir} not found.")
        return
        
    if os.path.exists(dst_dir):
        shutil.rmtree(dst_dir)
    os.makedirs(dst_dir)
    
    for split in ['train', 'valid', 'test']:
        src_img_dir = os.path.join(src_dir, split, 'images')
        src_lbl_dir = os.path.join(src_dir, split, 'labels')
        
        dst_img_dir = os.path.join(dst_dir, split, 'images')
        dst_lbl_dir = os.path.join(dst_dir, split, 'labels')
        
        if not os.path.exists(src_img_dir):
            continue
            
        os.makedirs(dst_img_dir, exist_ok=True)
        os.makedirs(dst_lbl_dir, exist_ok=True)
        
        # Copy labels
        for lbl in os.listdir(src_lbl_dir):
            shutil.copy(os.path.join(src_lbl_dir, lbl), os.path.join(dst_lbl_dir, lbl))
            
        # Process images
        imgs = os.listdir(src_img_dir)
        print(f"Processing {len(imgs)} images in {split}...")
        for img_name in imgs:
            src_path = os.path.join(src_img_dir, img_name)
            dst_path = os.path.join(dst_img_dir, img_name)
            shift_hue_to_red(src_path, dst_path)

if __name__ == "__main__":
    src = "real_dataset"
    dst = "sockeye_dataset"
    print("Creating synthetic Sockeye dataset from Atlantic Salmon...")
    convert_dataset(src, dst)
    
    # Copy and update data.yaml
    if os.path.exists(os.path.join(src, "data.yaml")):
        with open(os.path.join(src, "data.yaml"), "r") as f:
            yaml_content = f.read()
        
        yaml_content = yaml_content.replace("real_dataset", "sockeye_dataset")
        
        with open(os.path.join(dst, "data.yaml"), "w") as f:
            f.write(yaml_content)
    print("Done! Sockeye dataset created.")
