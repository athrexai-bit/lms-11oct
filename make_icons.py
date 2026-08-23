from PIL import Image, ImageDraw, ImageFont
import os, math

os.makedirs('icons', exist_ok=True)

sizes = [72, 96, 128, 144, 152, 192, 384, 512]

for size in sizes:
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded rect background — purple to blue gradient simulation
    radius = int(size * 0.22)
    # Draw gradient manually row by row
    for y in range(size):
        t = y / size
        r = int(124 + (37 - 124) * t)   # 7c3aed -> 2563eb
        g = int(58  + (99 - 58)  * t)
        b = int(237 + (235 - 237)* t)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))

    # Apply rounded corners mask
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([0, 0, size-1, size-1], radius=radius, fill=255)
    img.putalpha(mask)

    # Draw "A" letter
    draw = ImageDraw.Draw(img)
    font_size = int(size * 0.52)
    try:
        font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', font_size)
    except:
        font = ImageFont.load_default()

    text = 'A'
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1] - int(size * 0.05)
    draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)

    # Draw "AI" below
    small_size = int(size * 0.18)
    try:
        small_font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', small_size)
    except:
        small_font = ImageFont.load_default()

    ai_text = 'AI'
    ai_bbox = draw.textbbox((0, 0), ai_text, font=small_font)
    aw = ai_bbox[2] - ai_bbox[0]
    ax = (size - aw) / 2 - ai_bbox[0]
    ay = int(size * 0.72)
    draw.text((ax, ay), ai_text, fill=(255, 255, 255, 200), font=small_font)

    img.save(f'icons/icon-{size}.png', 'PNG')
    print(f'✅ icons/icon-{size}.png')

# Also create a simple screenshot placeholder
ss = Image.new('RGB', (390, 844), (13, 13, 26))
ss_draw = ImageDraw.Draw(ss)
ss_draw.rectangle([0, 0, 390, 64], fill=(19, 19, 31))
try:
    f = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 28)
    ss_draw.text((20, 18), 'Athrexai', fill=(167, 139, 250), font=f)
except:
    pass
ss.save('icons/screenshot-mobile.png', 'PNG')
print('✅ icons/screenshot-mobile.png')
print('\nAll icons generated!')
