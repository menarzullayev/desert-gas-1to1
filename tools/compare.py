"""Zone colour error (CIE76 on zone means), global SSIM and layout checks against a private reference frame."""
import sys, json, cv2, numpy as np
Z={'sky_top':(20,20,680,180),'sky_mid':(20,220,680,160),'sky_low':(20,420,680,120),'glow_left':(10,530,250,45),'mountain_L':(20,615,300,60),'mountain_R':(480,600,130,55),'plain':(20,690,140,24),'sage':(20,745,120,35),'lot':(200,815,480,35),'gravel_mid':(200,890,480,80),'gravel_low':(60,1080,600,60),'front_bush':(170,1150,320,120),'fascia':(345,674,240,10),'pink_wall':(556,715,34,65),'window':(628,714,56,44),'shop_blue':(628,766,56,18),'van_side':(250,735,90,40),'van_front':(175,745,55,35),'sign':(664,622,50,36),'apron':(380,797,200,8),'bush_left':(10,820,130,60)}
def lab(i): return cv2.cvtColor(i.astype(np.float32)/255,cv2.COLOR_BGR2Lab)
def ssim(a,b):
    a=cv2.cvtColor(a,cv2.COLOR_BGR2GRAY).astype(float);b=cv2.cvtColor(b,cv2.COLOR_BGR2GRAY).astype(float);g=lambda x:cv2.GaussianBlur(x,(11,11),1.5)
    ma,mb=g(a),g(b);sa,sb,sab=g(a*a)-ma*ma,g(b*b)-mb*mb,g(a*b)-ma*mb
    return float((((2*ma*mb+6.5)*(2*sab+58.5))/((ma*ma+mb*mb+6.5)*(sa+sb+58.5))).mean())
ref=cv2.imread('refs/r150.png');R=lab(ref);res={}
for f in sys.argv[1:]:
    im=cv2.imread(f)
    if im.shape!=ref.shape: im=cv2.resize(im,(720,1280),interpolation=cv2.INTER_AREA)
    L=lab(im);d={}
    for k,(x,y,w,h) in Z.items():
        a=R[y:y+h,x:x+w].reshape(-1,3).mean(0);b=L[y:y+h,x:x+w].reshape(-1,3).mean(0);d[k]=(round(float(np.linalg.norm(a-b)),1),[int(round(v)) for v in (b-a)])
    m=np.mean([v[0] for v in d.values()]);print(f,'mean dE %.1f'%m,'SSIM %.3f'%ssim(ref,im),'| dL,da,db per zone');print('  '+'  '.join(f'{k}:{v[0]}{v[1]}' for k,v in d.items()));res[f]=dict(meanDE=round(float(m),2),ssim=round(ssim(ref,im),3),zones={k:v[0] for k,v in d.items()})
json.dump(res,open('out/metrics.json','w'),indent=1)
