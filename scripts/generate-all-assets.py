import os
import math
import base64
from io import BytesIO
from PIL import Image

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

# Exact master circular logo with clean antialiased circular boundary
# Preserving the supplied logo exactly: typography, proportions, colors, symbols
master = Image.new('RGBA', (w, h), (0, 0, 0, 0))
cx, cy = w / 2.0, h / 2.0
r_max = min(cx, cy) - 2.0

for y in range(h):
    for x in range(w):
        dx = x - cx
        dy = y - cy
        dist = math.sqrt(dx * dx + dy * dy)
        if dist <= (r_max - 2.0):
            master.putpixel((x, y), raw_img.getpixel((x, y)) + (255,))
        elif dist <= r_max:
            alpha = int(255 * (r_max - dist) / 2.0)
            r, g, b = raw_img.getpixel((x, y))
            master.putpixel((x, y), (r, g, b, alpha))

os.makedirs('public', exist_ok=True)
os.makedirs('public/brand', exist_ok=True)
os.makedirs('app', exist_ok=True)

# 1. Master files in public and brand directories
master.save('public/sufitube-circular-logo.png')
master.save('public/brand/sufitube-circular-logo.png')
raw_img.save('public/sufitube-circular-logo.jpg')
raw_img.save('public/brand/sufitube-circular-logo.jpg')

# 512x512 Master Website Logo
master_512 = master.resize((512, 512), Image.Resampling.LANCZOS)
master_512.save('public/brand/sufipulse-master-logo-512.png')
master_512.save('public/icon-512.png')
master_512.save('app/icon.png')

# 192x192 Android / Web App Manifest icon
master_192 = master.resize((192, 192), Image.Resampling.LANCZOS)
master_192.save('public/icon-192.png')

# 180x180 Apple Touch Icon
master_180 = master.resize((180, 180), Image.Resampling.LANCZOS)
master_180.save('public/apple-touch-icon.png')
master_180.save('app/apple-icon.png')

# Favicon PNG sizes: 48x48, 32x32, 16x16
fav_48 = master.resize((48, 48), Image.Resampling.LANCZOS)
fav_48.save('public/favicon-48x48.png')
fav_48.save('public/favicon.png')

fav_32 = master.resize((32, 32), Image.Resampling.LANCZOS)
fav_32.save('public/favicon-32x32.png')

fav_16 = master.resize((16, 16), Image.Resampling.LANCZOS)
fav_16.save('public/favicon-16x16.png')

# Multi-resolution ICO: 16x16, 32x32, 48x48
ico_sizes = [(16, 16), (32, 32), (48, 48)]
master.save('app/favicon.ico', format='ICO', sizes=ico_sizes)

# High-resolution SVG embedding 512x512 master logo
buf = BytesIO()
master_512.save(buf, format='PNG')
b64 = base64.b64encode(buf.getvalue()).decode('utf-8')

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image href="data:image/png;base64,{b64}" width="512" height="512" />
</svg>
'''

with open('app/icon.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)

print("Exact master circular visual assets generated successfully!")
