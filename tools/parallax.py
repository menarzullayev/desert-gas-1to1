"""Parallax check: horizontal shift (px) between two frames, ours vs the private reference, per depth layer."""
import cv2, json
def tr(a,b,x,y,w,h,r=330):
    T=a[y:y+h,x:x+w];X0=max(0,x-90);X1=min(720,x+w+r);R=cv2.matchTemplate(b[max(0,y-14):y+h+14,X0:X1],T,cv2.TM_CCOEFF_NORMED);_,m,_,p=cv2.minMaxLoc(R);return X0+p[0]-x,round(m,2)
g=lambda f:cv2.imread(f)
B={'mountain ridge':(540,545,110,50),'van':(160,712,200,92),'canopy':(330,660,120,40),'left bush':(0,790,120,100),'middle bush':(385,990,100,75)}
out={}
for k,b in B.items():
    r=tr(g('refs/r150.png'),g('refs/r300.png'),*b); o=tr(g('out/raw/rt150.png'),g('out/raw/rt300.png'),*b); out[k]=dict(reference=r,ours=o); print(f'{k:15s} ref {r[0]:+4d}px (score {r[1]})   ours {o[0]:+4d}px (score {o[1]})')
json.dump(out,open('out/parallax.json','w'),indent=1)
