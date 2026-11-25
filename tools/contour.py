"""Object placement error: aligns gradient images of each object crop (search +-14 px) and reports the offset as % of frame width."""
import cv2, numpy as np, json, sys
B={'canopy':(325,655,285,50),'canopy columns':(375,690,190,110),'van':(160,708,205,102),'shop front':(548,684,172,110),'sign':(652,585,68,80),'pumps':(384,716,150,82),'ridge left':(0,570,300,45),'ridge right':(400,540,300,60),'left bush':(0,785,190,108),'middle bush':(372,985,120,85),'front bush':(110,1100,420,170)}
def grad(f):
    i=cv2.imread(f); i=cv2.resize(i,(720,1280),interpolation=cv2.INTER_AREA) if i.shape[1]!=720 else i
    g=cv2.GaussianBlur(cv2.cvtColor(i,cv2.COLOR_BGR2GRAY).astype(np.float32),(0,0),1.6);return cv2.GaussianBlur(cv2.magnitude(cv2.Sobel(g,5,1,0),cv2.Sobel(g,5,0,1)),(0,0),1.2)
R,O=grad('refs/r150.png'),grad(sys.argv[1]);S=14;out={}
P=cv2.copyMakeBorder(R,S,S,S,S,cv2.BORDER_REPLICATE)
for k,(x,y,w,h) in B.items():
    m=cv2.matchTemplate(P[y:y+h+2*S,x:x+w+2*S],O[y:y+h,x:x+w],cv2.TM_CCOEFF_NORMED);_,v,_,p=cv2.minMaxLoc(m);dx,dy=p[0]-S,p[1]-S;e=float(np.hypot(dx,dy)/7.2);out[k]=dict(dx=dx,dy=dy,pct=round(e,2),score=round(float(v),2));print(f'{k:15s} dx {dx:+3d} dy {dy:+3d}  {e:.2f}%  score {v:.2f}')
json.dump(out,open('out/contour.json','w'),indent=1)
