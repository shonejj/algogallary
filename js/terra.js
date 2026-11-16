// Terra: raymarched 3D terrain worlds. Continuous terrain grammar (ridged/terraced/dunes/canyons),
// water, snow, instanced flora, sky systems, clouds, fog, sun/moon lighting with soft shadows.
// Video: the camera orbits a closed path through the infinite terrain, so the loop is seamless.
export const TERRA_GLSL = `
uniform vec4 uW0; // ridged, terrace, dunes, canyons (0..1 blend weights)
uniform vec4 uW1; // height, feature scale, water level, snow line
uniform vec4 uW2; // sun elevation(-.3..1), sun azimuth, fog, sky kind(0 plain,1 alien planet,2 aurora,3 dust,4 storm)
uniform vec4 uW3; // camera(0 low,1 aerial,2 ground-up,3 top-down), focal, flora density, flora kind(0 none,1 pines,2 round,3 crystals,4 spires,5 shrooms)
uniform vec4 uW4; // look(0 natural,1 toon), clouds, camera speed, extra(0 none,1 sky ring,2 floating rocks,3 city lights)
vec3 SUN,SUNC,SKYA;float OCT,WL;
float terr(vec2 p){p=p*uW1.y*.35+uSeed.xy*40.;float n=0.,a=.5;vec2 q=p;mat2 m=mat2(1.6,1.2,-1.2,1.6);
 for(int i=0;i<6;i++){if(float(i)>=OCT)break;float v=noise(q);float r=1.-abs(v*2.-1.);v=mix(v,r*r,uW0.x);n+=a*v;q=m*q;a*=.5;}
 n/=.97;
 if(uW0.z>.01){float d=.5+.5*sin(p.x*2.2+p.y*.6+noise(p*.5)*5.);n=mix(n,d*.55+n*.45,uW0.z);}
 if(uW0.y>.01){float k=6.;n=mix(n,(floor(n*k)+smoothstep(.2,.8,fract(n*k)))/k,uW0.y);}
 if(uW0.w>.01){float r=abs(noise(p*.45+3.)-.5);n*=mix(1.,smoothstep(.0,.14,r)*.85+.15,uW0.w);}
 return (n-.35)*uW1.x*2.;}
float flora(vec3 p,out float gl){gl=0.;float k=uW3.w;if(k<.5)return 1e3;
 float cs=.45;vec2 id=floor(p.xz/cs);vec2 c=(id+.5)*cs;float h=h21(id+uSeed.zw*30.);if(h>uW3.z)return .3;
 c+=(h22(id)-.5)*cs*.6;float o=OCT;OCT=3.;float gy=terr(c);OCT=o;if(gy<WL+.02)return .3;
 vec3 q=p-vec3(c.x,gy,c.y);float s=(.12+.16*fract(h*7.))*(k>3.5&&k<4.5?2.2:1.);
 if(k<1.5)return max(length(q.xz)-s*.32*(1.-clamp(q.y/s,0.,1.)),max(-q.y,q.y-s))*.6;
 if(k<2.5)return min(length(q-vec3(0.,s*.7,0.))-s*.33,max(length(q.xz)-s*.05,max(-q.y,q.y-s*.6)));
 if(k<3.5){vec3 r=q-vec3(0.,s*.5,0.);r.xz=rot(h*6.)*r.xz;float d=(abs(r.x)*1.6+abs(r.y)+abs(r.z)*1.6-s*.5)*.5;gl=exp(-max(d,0.)*30.);return d;}
 if(k<4.5)return max(length(q.xz)-s*.06*(1.-q.y/s*.6),max(-q.y,q.y-s));
 float cap=max(length(q-vec3(0.,s*.55,0.))-s*.35,-(q.y-s*.5));gl=exp(-max(cap,0.)*25.)*.8;
 return min(cap,max(length(q.xz)-s*.06,max(-q.y,q.y-s*.6)));}
vec2 map(vec3 p){float d=(p.y-terr(p.xz))*.45;float m=0.;
 if(uW3.w>.5&&p.y<uW1.x+.6){float g;float f=flora(p,g);if(f<d){d=f;m=1.;}}
 if(uW4.w>1.5&&uW4.w<2.5){vec3 q=p;q.xz=mod(q.xz+2.,4.)-2.;vec2 id=floor((p.xz+2.)/4.);float hh=h21(id+7.);
  if(hh<.45){q.y-=uW1.x*2.6+1.8+hh*1.2+.06*sin(T+hh*9.);float r=.25+.35*hh;float isl=max(length(q*vec3(1.,1.6,1.))-r,-(q.y+.0))*.7;
   float bot=(length(q*vec3(1.,.55,1.))-r*.95)*.7;isl=min(isl,max(bot,q.y));if(isl<d){d=isl;m=2.;}}}
 return vec2(d,m);}
vec3 skyc(vec3 rd){float se=SUN.y;vec3 zen=mix(mix(uPal[0],uPal[1],.45),uPal[2],smoothstep(-.15,.6,se));vec3 hor=mix(uPal[1],uPal[4],smoothstep(-.2,.5,se));
 hor=mix(hor,uPal[3],clamp(1.-abs(se-.05)*4.,0.,1.)*.7);vec3 c=mix(hor,zen,pow(clamp(rd.y,0.,1.),.55));
 float sd=max(dot(rd,SUN),0.);c+=mix(uPal[3],vec3(1.),.4)*pow(sd,6.)*.35*smoothstep(-.2,.1,se)+SUNC*smoothstep(.9986,.9993,sd);
 float night=smoothstep(.1,-.15,se);
 if(night>0.){vec2 sp=floor(vec2(atan(rd.z,rd.x)*180.,rd.y*240.));c+=night*step(.996,h21(sp))*(.5+.5*sin(T*2.+h21(sp*1.3)*40.))*smoothstep(0.,.2,rd.y);
  vec3 md=normalize(vec3(-SUN.x,.35,-SUN.z));float mdd=dot(rd,md);c=mix(c,mix(uPal[4],vec3(.95),.4),night*smoothstep(.9994,.9996,mdd));c+=uPal[4]*night*pow(max(mdd,0.),40.)*.25;}
 float sk=uW2.w;
 if(sk>.5&&sk<1.5){vec3 pd=normalize(vec3(cos(uSeed.x*6.),.32+.2*uSeed.y,sin(uSeed.x*6.)));float pdd=dot(rd,pd);float R=.985;
  if(pdd>R){float u=(pdd-R)/(1.-R);vec3 l=normalize(rd-pd);float b=sin((rd.y+l.x*.3)*90.+noise(rd.xz*20.)*3.);c=mix(c,mix(uPal[2],uPal[3],.5+.5*b)*(.35+.65*smoothstep(0.,.6,u)),smoothstep(R,R+.0015,pdd));}
  c+=uPal[3]*.25*exp(-abs(pdd-R)*400.);}
 else if(sk<2.5&&sk>1.5){float r=fbm(vec2(atan(rd.z,rd.x)*2.+L.x*.3,rd.y*3.)+uSeed.xy*9.);c+=mix(uPal[2],uPal[4],r)*smoothstep(.15,0.,abs(rd.y-.35-(r-.5)*.4))*.7*(.5+.5*sin(atan(rd.z,rd.x)*30.+r*10.+T));}
 if(uW4.w>.5&&uW4.w<1.5){vec3 q=rd;q.xy=rot(.35)*q.xy;float e=abs(length(q.xz*vec2(1.,1.))-.0)*0.;float a=abs(q.y-.12*sin(atan(q.z,q.x)));c=mix(c,mix(uPal[4],uPal[2],.4),smoothstep(.012,.004,a)*.8*smoothstep(-.05,.1,rd.y));}
 return c;}
float shadow(vec3 ro,vec3 rd){float s=1.,t=.06;float o=OCT;OCT=3.;for(int i=0;i<18;i++){float h=map(ro+rd*t).x;s=min(s,10.*h/t);t+=clamp(h,.05,.4);if(s<.02||t>6.)break;}OCT=o;return clamp(s,0.,1.);}
vec3 gen(){vec2 p=uv0();OCT=6.;
 float az=uW2.y*TAU;SUN=normalize(vec3(cos(az),uW2.x,sin(az)));
 float day=smoothstep(-.12,.25,SUN.y);SUNC=mix(uPal[2]*.7+vec3(.1),mix(uPal[4],vec3(1.,.95,.85),.5),day);
 vec3 LD=SUN.y>-.05?SUN:normalize(vec3(-SUN.x,.35,-SUN.z));
 WL=uW1.z;
 float a=uSeed.w*TAU+T*uW4.z;float R=5.+3.*uSeed.z;vec3 ro=vec3(cos(a),0.,sin(a))*R;
 vec3 fw=normalize(vec3(-sin(a),0.,cos(a)));if(uW4.z<.5)fw=normalize(vec3(cos(uSeed.y*6.),0.,sin(uSeed.y*6.)));
 float cm=uW3.x;OCT=4.;float gh=max(max(terr(ro.xz),terr(ro.xz+fw.xz*.6)),max(terr(ro.xz+fw.xz*1.4),WL));float gh2=max(terr(ro.xz+fw.xz*2.6),terr(ro.xz+fw.xz*4.));OCT=6.;float pitch;
 if(cm<.5){ro.y=max(gh+.35,gh2-.1);pitch=-.05;}else if(cm<1.5){ro.y=max(gh,gh2)+1.9;pitch=-.2;}else if(cm<2.5){ro.y=gh+.1;pitch=.07;}else{ro.y=max(gh,gh2)+4.;pitch=-.7;}
 fw=normalize(fw*cos(pitch)+vec3(0.,sin(pitch),0.));vec3 rt=normalize(cross(fw,vec3(0.,1.,0.)));vec3 up=cross(rt,fw);
 vec3 rd=normalize(fw*uW3.y+p.x*rt+p.y*up);
 float t=.04;vec2 h=vec2(0.);bool hit=false;float far=26.;
 for(int i=0;i<140;i++){OCT=t<4.?6.:(t<10.?5.:4.);vec3 pos=ro+rd*t;h=map(pos);if(abs(h.x)<.0015*t){hit=true;break;}t+=h.x;if(t>far||pos.y>uW1.x*2.5+3.&&rd.y>0.)break;}
 vec3 sky=skyc(rd);vec3 col=sky;
 float tw=rd.y<0.?(WL-ro.y)/rd.y:1e3;bool water=uW1.z>-.9&&tw>0.&&(!hit||tw<t);
 if(hit&&!water){vec3 pos=ro+rd*t;vec2 e=vec2(.004*max(1.,t*.4),0.);OCT=t<4.?6.:5.;
  vec3 n=normalize(vec3(map(pos+e.xyy).x-map(pos-e.xyy).x,map(pos+e.yxy).x-map(pos-e.yxy).x,map(pos+e.yyx).x-map(pos-e.yyx).x));
  if(h.y<.5){float hh=pos.y/max(uW1.x,.1)*.5+.5;
   vec3 alb=pal(clamp(hh*.75+.15,0.,1.));alb=mix(alb,mix(uPal[0],uPal[1],.5)*1.2+.04,smoothstep(.8,.55,n.y));
   alb=mix(alb,mix(uPal[4],vec3(1.),.6),smoothstep(uW1.w,uW1.w+.08,pos.y+n.y*.05)*smoothstep(.55,.8,n.y));
   alb=mix(alb,mix(uPal[3],uPal[4],.5),smoothstep(WL+.06,WL+.01,pos.y)*step(-.9,uW1.z));
   alb*=.9+.2*noise(pos.xz*30.);col=alb;}
  else if(h.y<1.5){float g;flora(pos,g);float k=uW3.w;col=k>2.5&&k<3.5||k>4.5?mix(uPal[3],uPal[4],.4):mix(uPal[0],uPal[1],.6)*1.1;col+=mix(uPal[3],uPal[4],.5)*g*1.5;}
  else{col=n.y>.3?mix(uPal[2],uPal[4],.3):mix(uPal[0],uPal[1],.5);}
  float dif=max(dot(n,LD),0.);float sh=dif>0.?shadow(pos+n*.01,LD):0.;
  float amb=.45+.25*n.y;
  vec3 lit=col*(SUNC*dif*sh*1.25+mix(uPal[1],sky,.5)*amb*.6);
  if(h.y>.5&&h.y<1.5){float g;flora(pos,g);lit+=mix(uPal[3],uPal[4],.5)*g*1.2*(1.-day*.6);}
  if(uW4.w>2.5&&h.y<.5){float c=step(.9,noise(pos.xz*14.))*smoothstep(.5,.9,n.y)*(1.-day);lit+=mix(uPal[3],vec3(1.,.8,.5),.5)*c*(.6+.4*sin(T*3.+pos.x*40.));}
  if(uW4.x>.5)lit=floor(lit*5.+.5)/5.;
  col=lit;}
 else if(water){vec3 pos=ro+rd*tw;float wv=noise(pos.xz*6.+L*.6)*.5+noise(pos.xz*14.-L*.4)*.5;vec3 n=normalize(vec3((wv-.5)*.15,1.,(noise(pos.xz*7.+3.)-.5)*.15));
  vec3 rf=reflect(rd,n);float fr=.2+.8*pow(1.-max(dot(-rd,n),0.),4.);OCT=3.;float depth=max(WL-terr(pos.xz),0.);
  vec3 deep=mix(uPal[0],uPal[1],.5),shallow=mix(uPal[2],uPal[4],.25);col=mix(shallow,deep,smoothstep(0.,.35,depth));
  col=mix(col,skyc(rf),fr*.85);col+=SUNC*pow(max(dot(rf,LD),0.),120.)*1.5;col=mix(col,vec3(1.),smoothstep(.02,0.,depth)*.4);t=tw;}
 if(hit||water){float fog=1.-exp(-t*(.02+uW2.z*.09));vec3 fc=mix(skyc(normalize(vec3(rd.x,.02,rd.z))),SUNC,.15*pow(max(dot(rd,LD),0.),4.));col=mix(col,fc,fog);}
 if(uW4.y>.01&&rd.y>0.){float tc=(uW1.x*1.8+3.-ro.y)/rd.y;if(tc>0.){vec2 cp=(ro+rd*tc).xz*.12+uSeed.xy*9.;float cn=fbm(cp+L*.25);
  float cm2=smoothstep(.62-uW4.y*.25,.85,cn)*smoothstep(0.,.25,rd.y);vec3 cc=mix(mix(uPal[1],uPal[4],.5),SUNC,.35*day+.2)*(.75+.35*cn);col=mix(col,cc,cm2*.85);}}
 if(uW2.w>2.5){col=mix(col,mix(uPal[3],uPal[1],uW2.w>3.5?.8:.2),.18+.1*fbm(p*3.+L*.3));}
 col+=SUNC*.18*pow(max(dot(rd,LD),0.),3.)*day;
 return col;}
`;

const PICK = (rng, a) => rng.pick(a);
export const TERRA_BIOMES = {
  any: { pals: ['alpine', 'dawnpeach', 'tealdusk', 'mars', 'jungle', 'arctic', 'desert', 'oceandusk', 'magalien', 'emerald', 'lofi', 'sakura', 'storm', 'random'] },
  alpine: { ridged: [0.6, 1], snow: [0.15, 0.5], flora: [1, 1, 2], water: [0.5, 1], pals: ['alpine', 'arctic', 'tealdusk', 'oceandusk'] },
  desert: { ridged: [0, 0.3], terrace: [0.3, 1], dunes: [0.4, 1], water: [0, 0], flora: [0, 4, 3], snow: [9, 9], pals: ['desert', 'mars', 'dawnpeach'] },
  alien: { sky: [1, 1, 2], flora: [3, 5, 4], water: [0.6, 1], pals: ['magalien', 'emerald', 'alien', 'mars', 'opal'] },
  archipelago: { water: [1, 1], height: [0.5, 0.9], flora: [2, 1], snow: [9, 9], pals: ['oceandusk', 'tealdusk', 'jungle', 'sakura'] },
  canyon: { canyon: [0.6, 1], terrace: [0.3, 0.9], water: [0.3, 1], flora: [0, 2, 4], snow: [9, 9], pals: ['mars', 'desert', 'dawnpeach', 'earth'] },
  frozen: { ridged: [0.5, 1], snow: [-0.6, -0.1], sun: [-0.2, 0.3], sky: [2, 0, 2], flora: [1, 3], pals: ['arctic', 'glacier', 'ice', 'storm'] },
  night: { sun: [-0.3, -0.12], sky: [0, 2, 1], extra: [3, 3, 0, 1], flora: [5, 3, 1], pals: ['lofi', 'magalien', 'emerald', 'tealdusk', 'neon'] },
};
export function terraConfig(rng, biome = 'any', O = {}) {
  const B = { ...TERRA_BIOMES.any, ...(TERRA_BIOMES[biome] || {}) };
  const r = (k, a, b) => (B[k] ? rng.float(B[k][0], B[k][1]) : rng.float(a, b));
  const pk = (k, list) => (B[k] && B[k].length > 2 ? PICK(rng, B[k]) : PICK(rng, list));
  const height = r('height', 0.6, 1.4);
  const waterOn = B.water ? rng.next() < (B.water[0] + B.water[1]) / 2 : rng.chance(0.45);
  const W = [
    r('ridged', 0, 1), rng.chance(0.3) ? r('terrace', 0.3, 1) : (B.terrace ? r('terrace', 0, 1) : 0), rng.chance(0.25) ? r('dunes', 0.3, 1) : (B.dunes ? r('dunes', 0, 1) : 0), rng.chance(0.25) ? r('canyon', 0.4, 1) : (B.canyon ? r('canyon', 0, 1) : 0),
    height, rng.float(0.6, 1.6), waterOn ? rng.float(-0.35, 0.05) * height : -1, B.snow ? r('snow', 0, 1) * height : (rng.chance(0.5) ? rng.float(0.2, 0.8) * height : 9),
    r('sun', -0.25, 0.8), rng.next(), rng.float(0, 1), pk('sky', [0, 0, 0, 1, 2, 3, 4]),
    O.cam != null ? +O.cam : rng.pick([0, 0, 0, 1, 1, 1, 2, 3]), rng.float(1.2, 2.2), rng.float(0.15, 0.6), pk('flora', [0, 1, 2, 3, 4, 5]),
    rng.chance(0.1) ? 1 : 0, rng.chance(0.6) ? rng.float(0.2, 1) : 0, 1, pk('extra', [0, 0, 0, 1, 2, 3]),
  ];
  const camN = ['low flight', 'aerial', 'ground', 'top-down'][W[12]];
  const terrN = [W[0] > 0.6 ? 'ridges' : '', W[1] > 0.4 ? 'terraces' : '', W[2] > 0.4 ? 'dunes' : '', W[3] > 0.4 ? 'canyons' : ''].filter(Boolean).join('+') || 'hills';
  const desc = [W[8] < -0.1 ? 'night' : W[8] < 0.15 ? 'golden hour' : 'day', terrN, W[6] > -0.9 ? 'water' : '', W[7] < 5 ? 'snow' : '', ['', 'pines', 'trees', 'crystals', 'spires', 'glow-shrooms'][W[15]], ['', 'alien planet', 'aurora', 'dust', 'storm'][W[11]], ['', 'sky ring', 'floating rocks', 'lights'][W[19]], camN].filter(Boolean).join(' · ');
  return { W, pals: B.pals, desc };
}
