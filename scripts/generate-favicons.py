import os
import math
import base64
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont

# Source master visual: channels4_profile.jpg (SufiTube circular master logo)
src_candidates = [
    r'C:\Users\Fayaz\OneDrive\Desktop\channels4_profile.jpg',
    'public/sufitube-circular-logo.jpg',
    'public/sufitube-circular-logo.png'
]
src_path = next((p for p in src_candidates if os.path.exists(p)), None)
if not src_path:
    raise FileNotFoundError("Could not find channels4_profile.jpg")

print(f"Loading master logo from: {src_path}")
raw_img = Image.open(src_path).convert('RGB')
w, h = raw_img.size

# 1. Master full circular logo with smooth transparent edges
master_circular = Image.new('RGBA', (w, h), (0, 0, 0, 0))
cx, cy = w / 2.0, h / 2.0
r_max = min(cx, cy) - 2.0

for y in range(h):
    for x in range(w):
        dx = x - cx
        dy = y - cy
        dist = math.sqrt(dx * dx + dy * dy)
        if dist <= (r_max - 2.0):
            master_circular.putpixel((x, y), raw_img.getpixel((x, y)) + (255,))
        elif dist <= r_max:
            alpha = int(255 * (r_max - dist) / 2.0)
            r, g, b = raw_img.getpixel((x, y))
            master_circular.putpixel((x, y), (r, g, b, alpha))

os.makedirs('public', exist_ok=True)
os.makedirs('public/brand', exist_ok=True)
os.makedirs('app', exist_ok=True)

# Save master circular representations
master_circular.save('public/sufitube-circular-logo.png')
master_circular.save('public/brand/sufitube-circular-logo.png')
raw_img.save('public/sufitube-circular-logo.jpg')
raw_img.save('public/brand/sufitube-circular-logo.jpg')

# 2. Simplified Favicon Version (Optimized for small tab/SERP legibility)
# Deep navy circular base matching the master artwork
navy_color = (12, 20, 41, 255)
fav_source = Image.new('RGBA', (w, h), (0, 0, 0, 0))
draw = ImageDraw.Draw(fav_source)
draw.ellipse([2, 2, w - 3, h - 3], fill=navy_color)

# Crop the prominent "SufiTube" brand mark (x: 48..550, y: 180..338)
# Bounds in 600x600 coordinate space
mark_crop = master_circular.crop((48, 180, 550, 338))
mw, mh = mark_crop.size

# Vertically center the SufiTube mark with slight upward offset for 'USA'
target_x = (w - mw) // 2
target_y = (h - mh) // 2 - 18
fav_source.paste(mark_crop, (target_x, target_y), mark_crop)

# Clean, letter-spaced 'U S A' sub-mark
try:
    font = ImageFont.truetype('arialbd.ttf', 38)
except:
    font = ImageFont.load_default()

usa_text = 'U S A'
bbox = draw.textbbox((0, 0), usa_text, font=font)
tw = bbox[2] - bbox[0]
draw.text(((w - tw) // 2, target_y + mh + 24), usa_text, fill=(255, 255, 255, 240), font=font)

fav_source.save('public/sufitube-favicon-source.png')

# 3. Generate multi-resolution ICO (16x16, 32x32, 48x48) in app/
ico_sizes = [(16, 16), (32, 32), (48, 48)]
fav_source.save('app/favicon.ico', format='ICO', sizes=ico_sizes)

# 4. Generate PNG sizes for browser tabs and mobile homescreens
fav_source.resize((16, 16), Image.Resampling.LANCZOS).save('public/favicon-16x16.png')
fav_source.resize((32, 32), Image.Resampling.LANCZOS).save('public/favicon-32x32.png')
fav_source.resize((32, 32), Image.Resampling.LANCZOS).save('public/favicon.png')

# High-resolution Apple Touch & PWA icons (use full master circular emblem)
master_circular.resize((180, 180), Image.Resampling.LANCZOS).save('public/apple-touch-icon.png')
master_circular.resize((180, 180), Image.Resampling.LANCZOS).save('app/apple-icon.png')
master_circular.resize((192, 192), Image.Resampling.LANCZOS).save('public/icon-192.png')
master_circular.resize((512, 512), Image.Resampling.LANCZOS).save('public/icon-512.png')
master_circular.resize((512, 512), Image.Resampling.LANCZOS).save('app/icon.png')

# 5. Generate high-res SVG wrapper with embedded simplified favicon
fav_512 = fav_source.resize((512, 512), Image.Resampling.LANCZOS)
buf = BytesIO()
fav_512.save(buf, format='PNG')
b64 = base64.b64encode(buf.getvalue()).decode('utf-8')

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image href="data:image/png;base64,{b64}" width="512" height="512" />
</svg>
'''

with open('app/icon.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)

print("All SufiTube / SufiPulse USA brand identity assets generated successfully!")
