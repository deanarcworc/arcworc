from pathlib import Path
import re,xml.etree.ElementTree as ET
from PIL import Image,ImageDraw,ImageFont
from fontTools.svgLib.path import parse_path
from fontTools.pens.basePen import BasePen
from fontTools.ttLib import TTFont

root=Path(__file__).resolve().parents[1]
class Outline(BasePen):
    def __init__(self):super().__init__(None);self.contours=[];self.points=[]
    def _moveTo(self,p):self.points=[p]
    def _lineTo(self,p):self.points.append(p)
    def _curveToOne(self,a,b,c):
        p=self._getCurrentPoint()
        for i in range(1,13):
            t=i/12;u=1-t;self.points.append((u**3*p[0]+3*u*u*t*a[0]+3*u*t*t*b[0]+t**3*c[0],u**3*p[1]+3*u*u*t*a[1]+3*u*t*t*b[1]+t**3*c[1]))
    def _closePath(self):self.contours.append(self.points);self.points=[]
    def _endPath(self):self._closePath()
def area(points):return sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(points,points[1:]+points[:1]))/2
scale=3
im=Image.new('RGB',(1200*scale,630*scale),'#262626');mask=Image.new('L',im.size,0);draw=ImageDraw.Draw(mask)
for node in ET.parse(root/'dist/assets/wordmark-cream.svg').getroot():
    pen=Outline();parse_path(node.attrib['d'],pen);tx,ty=map(float,re.findall(r'[-\d.]+',node.attrib['transform']));contours=sorted(pen.contours,key=lambda p:abs(area(p)),reverse=True);outer=area(contours[0])
    for pts in contours:
        draw.polygon([((80+(x+tx)*1040/6582)*scale,(252+(y+ty)*1040/6582)*scale) for x,y in pts],fill=255 if area(pts)*outer>0 else 0)
im.paste('#f5f3ef',mask=mask)
font=TTFont(root/'dist/assets/manrope-variable.woff');font.flavor=None;font.save('/tmp/arcworc-social-font.ttf')
d=ImageDraw.Draw(im)
def text(pos,value,size,colour):d.text((pos[0]*scale,pos[1]*scale),value,font=ImageFont.truetype('/tmp/arcworc-social-font.ttf',size*scale),fill=colour)
text((80,114),'INDEPENDENT CREATIVE ECOSYSTEM',22,'#fa3827')
d.line((80*scale,428*scale,152*scale,428*scale),fill='#fa3827',width=3*scale)
text((80,463),'Artists. Experiences. Ideas.',30,'#f5f3ef')
text((80,540),'Cape Town · Connected everywhere',18,'#a5a3a0')
im.resize((1200,630),Image.Resampling.LANCZOS).save(root/'dist/assets/arcworc-social.png',optimize=True)
