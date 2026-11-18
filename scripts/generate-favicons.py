import os
import base64
from io import BytesIO
from PIL import Image

src_path = 'SufiPulse USA Logo Emblem.png'
im = Image.open(src_path)

if im.mode != 'RGBA':
    im_rgba = im.convert('RGBA')
else:
    im_rgba = im

os.makedirs('public', exist_ok=True)
os.makedirs('app', exist_ok=True)

# 1. Generate multi-resolution ICO (16x16, 32x32, 48x48) in app/
ico_sizes = [(16, 16), (32, 32), (48, 48)]
im_rgba.save('app/favicon.ico', format='ICO', sizes=ico_sizes)

# 2. Generate PNG sizes
im_rgba.resize((16, 16), Image.Resampling.LANCZOS).save('public/favicon-16x16.png')
im_rgba.resize((32, 32), Image.Resampling.LANCZOS).save('public/favicon-32x32.png')
im_rgba.resize((32, 32), Image.Resampling.LANCZOS).save('public/favicon.png')
im_rgba.resize((180, 180), Image.Resampling.LANCZOS).save('public/apple-touch-icon.png')
im_rgba.resize((180, 180), Image.Resampling.LANCZOS).save('app/apple-icon.png')
im_rgba.resize((192, 192), Image.Resampling.LANCZOS).save('public/icon-192.png')
im_rgba.resize((512, 512), Image.Resampling.LANCZOS).save('public/icon-512.png')
im_rgba.resize((512, 512), Image.Resampling.LANCZOS).save('app/icon.png')

# 3. Generate SVG wrapper with embedded 512x512 PNG
im_512 = im_rgba.resize((512, 512), Image.Resampling.LANCZOS)
buf = BytesIO()
im_512.save(buf, format='PNG')
b64 = base64.b64encode(buf.getvalue()).decode('utf-8')

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image href="data:image/png;base64,{b64}" width="512" height="512" />
</svg>
'''

with open('app/icon.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)

print("All favicon and icon assets generated successfully!")
