// Megastructures: infinite raymarched architecture built from repeated signed-distance fields.
// Modes: colonnade hall, arch corridor, city grid, Menger fractal, monolith field, spiral tower field.
export const MEGA_GLSL = `
uniform vec4 uW0; // mode, cell size, height variety, ornament
uniform vec4 uW1; // sun elevation, azimuth, fog, emissive
uniform vec4 uW2; // camera height, pitch, travel cells per loop, focal
uniform vec4 uW3; // floor gloss, ceiling(0/1), colour mapping, symmetry yaw
float CS,CEIL;vec3 LD;
float b3(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
vec2 map(vec3 p){float m=uW0.x;float d=p.y;float mat=0.;
 if(m<.5){vec2 id=floor(p.xz/CS+.5);vec3 q=p;q.xz-=id*CS;float r=CS*.11;
  float fl=1.+.08*cos(atan(q.z,q.x)*16.)*uW0.w;float col=max(length(q.xz)-r*fl,p.y-CEIL);
  col=min(col,b3(q-vec3(0.,.06,0.),vec3(r*1.6,.06,r*1.6)));col=min(col,b3(q-vec3(0.,CEIL-.05,0.),vec3(r*1.7,.05,r*1.7)));
  if(col<d){d=col;mat=1.;}
  if(uW3.y>.5){vec3 c=p;c.xz=mod(c.xz,CS)-CS*.5;float ce=max(CEIL+.05-p.y,-(b3(c-vec3(0.,CEIL,0.),vec3(CS*.36,.12,CS*.36))));ce=max(ce,p.y-CEIL-.6);if(ce<d){d=ce;mat=2.;}}}
 else if(m<1.5){vec3 q=p;q.z=mod(p.z,CS)-CS*.5;float W=CS*.55,H=CEIL;
  float wall=b3(q-vec3(0.,H*.5,0.),vec3(W*1.6,H*.5,CS*.1));float hole=min(length(q.xy-vec2(0.,H*.52))-W*.62,b3(q-vec3(0.,H*.26,0.),vec3(W*.62,H*.26,1.)));
  float arch=max(wall,-hole);float side=min(b3(vec3(abs(p.x)-W*1.7,p.y-H*.5,0.),vec3(.08,H*.5,1e3)),1e3);
  float win=b3(vec3(abs(p.x)-W*1.7,p.y-H*.55,mod(p.z+CS*.5,CS)-CS*.5),vec3(.2,H*.18,CS*.16));side=max(side,-win);
  if(arch<d){d=arch;mat=1.;}if(side<d){d=side;mat=1.;}
  if(uW3.y>.5){float roof=max(H+.25-p.y,length(vec2(p.x,p.y-H*.7))-W*1.75);roof=max(-roof,p.y-H-1.);}}
 else if(m<2.5){vec2 id=floor(p.xz/CS);vec2 idm=mod(id,8.);float hh=h21(idm+uSeed.xy*10.);float H=.3+hh*hh*hh*5.*uW0.z+.2;
  vec3 q=p;q.xz=mod(p.xz,CS)-CS*.5;float w=CS*(.22+.12*h21(idm+3.));
  float b=b3(q-vec3(0.,H*.5,0.),vec3(w,H*.5,w));float b2=b3(q-vec3(0.,H+.15*hh,0.),vec3(w*.6,.15*hh+.01,w*.6));b=min(b,b2);
  float sp=max(length(q.xz)-.012,max(-q.y,q.y-H-.6*step(.8,hh)));b=min(b,sp);
  b=min(b,CS*.35);if(b<d){d=b;mat=1.;}}
 else if(m<3.5){vec3 q=p-vec3(0.,1.05,0.);q.xz=mod(q.xz+3.,6.)-3.;float dd=b3(q,vec3(1.));float s=1.;
  for(int i=0;i<4;i++){vec3 a=mod(q*s,2.)-1.;s*=3.;vec3 r=abs(1.-3.*abs(a));float da=max(r.x,r.y),db=max(r.y,r.z),dc=max(r.z,r.x);dd=max(dd,(min(da,min(db,dc))-1.)/s);}
  if(dd<d){d=dd;mat=1.;}}
 else if(m<4.5){vec2 id=floor(p.xz/CS);float hh=h21(id+uSeed.zw*10.);vec3 q=p;q.xz=mod(p.xz,CS)-CS*.5;
  if(hh<.4){q.xz=rot(hh*20.)*q.xz;float H=(.6+1.8*fract(hh*7.))*uW0.z+.3;float s=b3(q-vec3(0.,H*.5,0.),vec3(.08,H*.5,CS*(.12+.1*fract(hh*3.))));if(s<d){d=s;mat=1.;}}
  d=min(d,CS*.45+p.y*0.);}
 else{vec2 id=floor(p.xz/CS);float hh=h21(mod(id,6.)+uSeed.xy*5.);vec3 q=p;q.xz=mod(p.xz,CS)-CS*.5;float H=1.+3.*hh*uW0.z;
  float a=q.y*(2.+3.*uW0.w);vec2 r=rot(a)*q.xz;float tw=b3(vec3(r.x,q.y-H*.5,r.y),vec3(.12*(1.-q.y/H*.5),H*.5,.12*(1.-q.y/H*.5)));
  float rings=max(abs(length(q.xz)-.2)-.012,abs(fract(q.y*2.)-.5)-.03);rings=max(rings,q.y-H);tw=min(tw,rings);tw=min(tw,CS*.4);if(tw<d){d=tw;mat=1.;}}
 return vec2(d,mat);}
vec3 skyc(vec3 rd){float se=LD.y;vec3 c=mix(mix(uPal[1],uPal[3],.5+.5*se),mix(uPal[0],uPal[2],smoothstep(-.2,.6,se)),pow(clamp(rd.y,0.,1.),.6));
 c+=mix(uPal[3],vec3(1.),.5)*pow(max(dot(rd,LD),0.),12.)*.5;c+=vec3(1.,.95,.85)*smoothstep(.9988,.9994,dot(rd,LD))*step(0.,se);
 vec2 sp=floor(vec2(atan(rd.z,rd.x)*180.,rd.y*240.));c+=smoothstep(.1,-.2,se)*step(.996,h21(sp))*smoothstep(0.,.2,rd.y);return c;}
vec3 gen(){vec2 p=uv0();CS=uW0.y;CEIL=uW0.x<.5?2.2+uW0.z*2.:(uW0.x<1.5?1.6+uW0.z*1.4:9.);
 float az=uW1.y*TAU;LD=normalize(vec3(cos(az),uW1.x,sin(az)));
 float m=uW0.x;vec3 ro,fw;
 if(m>2.5&&m<3.5||m>3.5&&m<4.5){float a=uSeed.w*TAU+T;float R=m<3.5?3.8:5.;ro=vec3(cos(a)*R,uW2.x*(m<3.5?2.:3.)+.25,sin(a)*R);fw=normalize(vec3(-sin(a),0.,cos(a))*.7-vec3(cos(a),0.,sin(a))*.5);}
 else{float trav=uPhase*CS*uW2.z*(m>1.5&&m<2.5||m>4.5?(m>4.5?6.:8.):1.);ro=vec3(m<1.5&&m>.5?0.:CS*.5,uW2.x*(m>1.5?4.:1.)+.25,trav+uSeed.x*CS*8.);
  if(m<1.5)ro.y=min(ro.y,CEIL*.6);fw=normalize(vec3(sin(uW3.w*1.2),0.,1.));if(m>1.5&&m<2.5)ro.x=CS*.5;}
 fw=normalize(fw+vec3(0.,uW2.y,0.));vec3 rt=normalize(cross(fw,vec3(0.,1.,0.)));vec3 up=cross(rt,fw);vec3 rd=normalize(fw*uW2.w+p.x*rt+p.y*up);
 float t=.02;vec2 h;bool hit=false;
 for(int i=0;i<120;i++){h=map(ro+rd*t);if(h.x<.001*t){hit=true;break;}t+=h.x*.85;if(t>40.)break;}
 vec3 sky=skyc(rd);vec3 col=sky;
 if(hit){vec3 pos=ro+rd*t;vec2 e=vec2(.002,0.);vec3 n=normalize(vec3(map(pos+e.xyy).x-map(pos-e.xyy).x,map(pos+e.yxy).x-map(pos-e.yxy).x,map(pos+e.yyx).x-map(pos-e.yyx).x));
  float ao=0.;for(int k=1;k<5;k++){float hk=float(k)*.06;ao+=(hk-map(pos+n*hk).x);}ao=clamp(1.-ao*3.,0.,1.);
  float sh=1.,st=.03;for(int k=0;k<24;k++){float d=map(pos+n*.004+LD*st).x;sh=min(sh,8.*d/st);st+=clamp(d,.03,.5);if(sh<.02||st>12.)break;}sh=clamp(sh,0.,1.);
  vec3 alb;float cm=uW3.z;
  if(h.y<.5){vec2 g=abs(fract(pos.xz/CS*(m>1.5&&m<2.5?1.:2.))-.5);alb=mix(uPal[1],uPal[2],.35);alb=mix(alb,uPal[0],step(.47,max(g.x,g.y))*.6);
   if(m>1.5&&m<2.5){vec2 c=abs(fract(pos.xz/CS)-.5);alb=mix(mix(uPal[0],uPal[1],.4),alb,step(c.x,.36)*step(c.y,.36));}}
  else{alb=pal(clamp(.45+.4*(cm<.5?n.y*.5+.5:fract(pos.y*.25+cm)),0.,1.));if(n.y<.5)alb=mix(alb,pal(.85),.25*abs(n.x));}
  float dif=max(dot(n,LD),0.);float night=smoothstep(.15,-.15,LD.y);
  vec3 sunc=mix(mix(uPal[4],vec3(1.,.95,.85),.5),uPal[2]*.4,night);
  col=alb*(sunc*dif*sh*1.3+mix(uPal[1],sky,.5)*(.35+.25*n.y)*ao);
  float em=uW1.w*(.3+.7*night);
  if(h.y>.5){if(m>1.5&&m<2.5){vec2 wq=vec2(dot(pos.xz,abs(n.x)>.5?vec2(0.,1.):vec2(1.,0.))*14.,pos.y*12.);vec2 wi=floor(wq);
     float lit=step(.6,h21(wi+floor(pos.xz/CS)*7.))*step(.25,fract(wq.x))*step(fract(wq.x),.75)*step(.3,fract(wq.y))*step(fract(wq.y),.75)*step(.3,1.-abs(n.y));col+=mix(uPal[3],uPal[4],.4)*lit*em*1.2;}
   else col+=uPal[3]*em*.9*smoothstep(.03,0.,abs(fract(pos.y*(m>4.5?2.:1.5))-.5)-.47);}
  if(h.y<.5&&uW3.x>0.){vec3 rf=reflect(rd,n);float fr=pow(1.-max(dot(-rd,n),0.),3.);col=mix(col,skyc(rf),fr*uW3.x*.7);}
  col=mix(col,skyc(normalize(vec3(rd.x,.05,rd.z))),1.-exp(-t*(.015+uW1.z*.07)));}
 col+=mix(uPal[3],vec3(1.),.5)*.12*pow(max(dot(rd,LD),0.),4.)*step(0.,LD.y);
 return col;}
`;
const MODES = ['colonnade', 'arch corridor', 'city grid', 'fractal', 'monolith field', 'spiral towers'];
export function megaConfig(rng, mode = null) {
  const m = mode != null ? mode : rng.int(0, 5);
  const W = [
    m, [rng.float(1.2, 2.2), rng.float(1.6, 2.6), rng.float(1.1, 1.8), 1, rng.float(2.2, 3.5), rng.float(1.6, 2.6)][m], rng.float(0.3, 1), rng.next(),
    rng.chance(0.3) ? rng.float(-0.25, -0.05) : rng.float(0.05, 0.7), rng.next(), rng.float(0, 1), rng.float(0.3, 1),
    [rng.float(0.3, 1), rng.float(0.2, 0.7), rng.float(0.4, 1.6), rng.float(0, 0.8), rng.float(0.05, 0.5), rng.float(0.5, 1.5)][m], rng.float(-0.25, 0.15), rng.pick([1, 1, 2]), rng.float(1.1, 1.9),
    rng.chance(0.5) ? rng.float(0.2, 1) : 0, rng.chance(0.5) ? 1 : 0, rng.chance(0.5) ? 0 : rng.next(), rng.float(-0.6, 0.6),
  ];
  const desc = [MODES[m], W[4] < 0 ? 'night' : W[4] < 0.2 ? 'low sun' : 'day', W[12] > 0 ? 'gloss floor' : '', W[7] > 0.6 ? 'glowing' : ''].filter(Boolean).join(' · ');
  return { W, desc };
}
