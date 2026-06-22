import imageio
import os
import sys

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)
    input_path = os.path.join(project_root, "public", "reports", "ai_demo.mp4")
    output_path = os.path.join(project_root, "public", "reports", "ai_demo_h264.mp4")
    
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found")
        sys.exit(1)
        
    print(f"Reading {input_path}...")
    reader = imageio.get_reader(input_path)
    meta = reader.get_meta_data()
    fps = meta.get('fps', 30)
    
    print(f"Writing to {output_path} with libx264 (H.264 codec)...")
    # Using libx264 for universal browser compatibility
    writer = imageio.get_writer(output_path, fps=fps, codec='libx264', macro_block_size=None)
    
    for i, frame in enumerate(reader):
        writer.append_data(frame)
        if i % 100 == 0:
            print(f"Converted {i} frames...")
            
    writer.close()
    reader.close()
    
    # Replace old file
    print("Replacing old file...")
    os.remove(input_path)
    os.rename(output_path, input_path)
    print("Conversion complete!")

if __name__ == "__main__":
    main()
