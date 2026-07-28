from PIL import Image
import os

def remove_black_bg(input_path, output_paths):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    new_data = []
    for item in datas:
        r, g, b, a = item
        # If the pixel is near black (outer rectangular frame)
        if r < 40 and g < 40 and b < 40:
            new_data.append((0, 0, 0, 0))  # 100% Transparent
        else:
            new_data.append((r, g, b, a))

    img.putdata(new_data)

    for out_path in output_paths:
        img.save(out_path, "PNG")
        print(f"✅ Transparent logo saved to: {out_path}")

input_logo = r"C:\Users\DELL\.gemini\antigravity\brain\9d5369d3-57d5-4f64-80ff-74f47f79eccb\.user_uploaded\media__1785262297126.jpg"
targets = [
    r"C:\Users\DELL\.gemini\antigravity\scratch\khandesh-darbar\public\images\logo.png",
    r"C:\Users\DELL\Downloads\khandesh-darbar\images\logo.png"
]

remove_black_bg(input_logo, targets)
