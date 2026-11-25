"""Frame integrity, temporal stability and parallax of the rendered sequence (reference frames are private)."""
import cv2, numpy as np, json, sys, os
D=sys.argv[1]; N=660; g=lambda i:cv2.imread(f'{D}/f{i:04d}.png')
bad=[i for i in range(N) if not os.path.exists(f'{D}/f{i:04d}.png') or g(i) is None]; print('missing/corrupt',bad)
p=None; df=[]; mean=[]
for i in range(N):
    s=cv2.resize(g(i),(360,640),interpolation=cv2.INTER_AREA).astype(np.float32); mean.append(s.mean()); 
    if p is not None: df.append(np.abs(s-p).mean())
    p=s
df=np.array(df); print('frame diff median %.2f max %.2f at %d | brightness range %.2f | identical neighbours %d'%(np.median(df),df.max(),df.argmax(),max(mean)-min(mean),(df<.01).sum()))
spike=[int(i) for i in range(3,len(df)-3) if df[i]>1.6*np.median(df[i-3:i+4])]; print('spikes',spike)
cap=cv2.VideoCapture('refs/right.mp4'); R=[]
while 1:
    ok,f=cap.read()
    if not ok: break
    R.append(f)
B={'mountain ridge':(540,545,110,50),'van':(160,712,200,92),'canopy':(330,660,120,40),'left bush':(0,790,120,100),'middle bush':(385,990,100,75)}
def tr(a,b,x,y,w,h):
    T=a[y:y+h,x:x+w];X0=max(0,x-330);X1=min(720,x+w+330);M=cv2.matchTemplate(b[max(0,y-14):y+h+14,X0:X1],T,cv2.TM_CCOEFF_NORMED);_,m,_,q=cv2.minMaxLoc(M);return X0+q[0]-x,round(float(m),2)
o=lambda i:cv2.resize(g(i),(720,1280),interpolation=cv2.INTER_AREA); out={}
for t in (30,90,210,270,300):
    for k,b in B.items():
        r=tr(R[150],R[t],*b);u=tr(o(300),o(t*2),*b);out[f'{k}@{t}']=dict(ref=r,ours=u)
for k in B: print(f'{k:15s}',' '.join(f"{t}: {out[f'{k}@{t}']['ref'][0]:+d}/{out[f'{k}@{t}']['ours'][0]:+d}" for t in (30,90,210,270,300)))
json.dump(dict(frames=N,bad=bad,spikes=spike,tracks=out),open('out/parallax.json','w'),indent=1)
