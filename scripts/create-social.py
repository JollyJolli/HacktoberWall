from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json
root=Path(__file__).resolve().parents[1]
font=lambda n:ImageFont.truetype(str(root/'assets/wall-display.ttf'),n)
im=Image.new('RGB',(1200,630),'#f2f0e8'); draw=ImageDraw.Draw(im)
draw.text((55,35),'HACKTOBERWALL',font=font(32),fill='#232522')
draw.text((55,95),'A YEAR OFF.',font=font(100),fill='#232522')
draw.text((55,195),'A WALL TO COME BACK TO.',font=font(80),fill='#232522')
draw.rectangle((55,320,1145,580),fill='#ee6336')
draw.text((75,335),'2024',font=font(75),fill='#232522')
draw.text((75,440),'2025',font=font(75),fill='#232522')
draw.line((75,488,234,488),fill='#232522',width=4)
draw.text((400,305),'2026',font=font(245),fill='#232522')
im.save(root/'assets/social.png',optimize=True)
# Read original dimensions; fix the embedding, never the source image.
with Image.open(root/'2024/src/img/mascot.webp') as mascot:
 print('Mascot dimensions',mascot.size)
print('Social preview created.')
