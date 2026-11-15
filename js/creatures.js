// Procedural creatures: one smooth signed-distance body where every part (head, ears, horns,
// arms, legs, tail) is smoothly unioned, so nothing floats or detaches. All proportions are
// continuous parameters, so there is no fixed list of species.
export const CREATURE_GLSL = `
uniform vec4 uW0; // body half-width, half-height, roundness, taper
uniform vec4 uW1; // head mode, head radius, ear type(0 none,1 round,2 pointy,3 antenna,4 horns,5 long), ear length
uniform vec4 uW2; // ear angle, arm length, leg length, tail
uniform vec4 uW3; // eye count, eye size, eye spacing, eye style(0 glossy,1 tall,2 iris,3 sleepy,4 happy)
uniform vec4 uW4; // mouth(0 smile,1 open,2 cat,3 o), material(0 cel,1 soft,2 gummy,3 plush), pattern(0 none,1 belly,2 spots,3 stripes), background
float BW,BH,HR,LH,HM,TOPR,EX;vec2 HC,TOPC;
float sdE(vec2 p,vec2 r){float k=length(p/r);return (k-1.)*min(r.x,r.y);}
float sdC(vec2 p,vec2 a,vec2 b,float ra,float rb){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h)-mix(ra,rb,h);}
float bodyD(vec2 q){vec2 c=q-vec2(0.,LH+BH);c.x*=1.+uW0.w*clamp(c.y/BH,-1.,1.)*.45;
 return mix(sdBox(c,vec2(BW,BH),min(BW,BH)*.55),sdE(c,vec2(BW,BH)),uW0.z);}
float F(vec2 q){float d=bodyD(q);
 if(HM>.5)d=smin(d,sdE(q-HC,vec2(HR*1.06,HR)),.07);
 float et=uW1.z,el=uW1.w;EX=1e3;
 if(et>.5){for(int k=0;k<2;k++){float s=float(k)*2.-1.;float a=s*(.42+.45*uW2.x)+.07*sin(T*2.+s);vec2 dir=vec2(sin(a),cos(a));
   vec2 base=TOPC+dir*TOPR*.78;
   if(et<1.5)d=smin(d,length(q-base-dir*TOPR*.18*el)-TOPR*.3,.04);
   else if(et<2.5)d=smin(d,sdC(q,base-dir*TOPR*.15,base+dir*TOPR*.75*el,TOPR*.28,TOPR*.04),.04);
   else if(et<3.5){vec2 tip=base+dir*TOPR*.9*el;d=min(d,sdC(q,base-dir*.01,tip,.009,.007));EX=min(EX,length(q-tip)-.03);}
   else if(et<4.5){vec2 tip=base+dir*TOPR*.55*el+vec2(s*TOPR*.25,TOPR*.1);EX=min(EX,sdC(q,base-dir*TOPR*.1,tip,TOPR*.13,TOPR*.025));}
   else d=smin(d,sdC(q,base-dir*TOPR*.1,base+dir*TOPR*1.35*el,TOPR*.17,TOPR*.13),.04);}}
 if(uW2.y>.15){for(int k=0;k<2;k++){float s=float(k)*2.-1.;vec2 sh=vec2(s*BW*.82,LH+BH*1.05);
   float wv=(k==1&&uP.w>.5)?.6+.4*sin(T*2.):0.;vec2 dir=normalize(vec2(s*(1.-wv*.5),-1.+wv*2.3));
   d=smin(d,sdC(q,sh,sh+dir*.11*uW2.y,.04,.034),.035);}}
 if(LH>.005){for(int k=0;k<2;k++){float s=float(k)*2.-1.;
   d=smin(d,sdC(q,vec2(s*BW*.42,LH+.03),vec2(s*BW*.48,.03),.045,.04),.03);d=smin(d,sdE(q-vec2(s*BW*.5,.026),vec2(.062,.028)),.02);}}
 if(uW2.w>.5)d=smin(d,sdC(q,vec2(-BW*.85,LH+BH*.5),vec2(-BW*1.38,LH+BH*1.1+.02*sin(T*2.)),.03,.055),.04);
 return d;}
float H(vec2 q){return sqrt(clamp(-F(q)/.07,0.,1.));}
vec3 bgCol(vec2 p){float b=uW4.w;vec3 c;
 if(b<.5){c=mix(uPal[4],uPal[3],clamp(.35-p.y,0.,1.)*.7);c=mix(c,mix(uPal[4],vec3(1.),.5),smoothstep(.4,.36,length(p-vec2(0.,.03)))*.45);}
 else if(b<1.5){c=mix(uPal[1],uPal[0],clamp(p.y+.6,0.,1.));vec2 g=floor(gl_FragCoord.xy/max(2.,uRes.y/400.));
  c+=step(.993,h21(g+uSeed.xy*50.))*(.5+.5*sin(T*2.+h21(g)*40.))*.8;c+=uPal[3]*.25*exp(-length(p-vec2(0.,.0))*3.);}
 else if(b<2.5){c=mix(uPal[4],uPal[3],.3);vec2 g=fract(p*8.)-.5;c=mix(c,mix(uPal[3],uPal[4],.3),fill((length(g)-.13)/8.)*.6);}
 else{float a=atan(p.y+.05,p.x)+T/12.;c=mix(mix(uPal[3],uPal[4],.25),mix(uPal[3],uPal[4],.6),step(.5,fract(a*12./TAU)));}
 return c;}
vec3 gen(){vec2 p=uv0();
 BW=uW0.x;BH=uW0.y*(1.+.015*sin(T*2.));HM=uW1.x;HR=uW1.y;LH=uW2.z*.07;
 float hop=LH>.005?.006*sin(T*2.):.03*abs(sin(T*2.));
 float tr=HM>.5?max(HR,.01):max(BW,BH);float et=uW1.z;float ear=et<.5?0.:(et>4.5?1.35:(et>2.5&&et<3.5?.95:.65))*uW1.w*tr;
 float Ht=LH+2.*uW0.y+(HM>.5?HR*1.5:0.)+ear*.8+.02;float SC=clamp(.66/Ht,.75,1.6);
 vec2 q=(p-vec2((uSeed.x-.5)*.1,-.4+hop*SC))/SC;
 float sq=LH>.005?0.:.05*cos(T*4.);q.x*=1.+sq;q.y*=1.-sq;
 HC=vec2(0.,LH+BH*2.+HR*.55);TOPC=HM>.5?HC:vec2(0.,LH+BH);TOPR=HM>.5?HR:max(BW,BH);
 vec2 FC=HM>.5?HC-vec2(0.,HR*.12):vec2(0.,LH+BH*1.22);float FR=HM>.5?HR:min(BW,BH)*.95;
 vec3 bg=bgCol(p);
 bg*=1.-.28*smoothstep(.03,-.02,sdE(p-vec2((uSeed.x-.5)*.1,-.4),vec2(BW*1.25*SC*(1.-hop*3.),.03)));
 float mat=uW4.y;vec2 qq=q;if(mat>2.5)qq+=(vec2(noise(q*90.),noise(q*90.+7.))-.5)*.012;
 float d=F(qq);float ex=EX;
 vec3 base=uP.x<.6?uPal[2]:(uP.x<.85?uPal[1]:uPal[3]);if(lum(base)<.22)base=mix(base,uPal[4],.35);
 vec3 INK=mix(uPal[0],vec3(.04),.6);
 vec2 e=vec2(.002,0.);vec3 n=normalize(vec3(-(H(qq+e.xy)-H(qq-e.xy))/.004*.06,-(H(qq+e.yx)-H(qq-e.yx))/.004*.06,1.));
 vec3 l=normalize(vec3(-.5,.6,.65));float dif=max(dot(n,l),0.);float spec=pow(max(dot(reflect(-l,n),vec3(0.,0.,1.)),0.),28.);
 float pat=uW4.z;float bd=bodyD(q);float onBody=step(bd,0.)*(HM>.5?1.:step(q.y,FC.y-FR*.45));
 if(pat>.5&&pat<1.5)base=mix(base,mix(uPal[4],vec3(1.),.3),fill(sdE(q-vec2(0.,LH+BH*.85),vec2(BW*.62,BH*.62)))*.75);
 else if(pat<2.5&&pat>1.5)base=mix(base,base*.72,onBody*step(.68,noise(q*13.+uSeed.zw*20.)));
 else if(pat>2.5)base=mix(base,base*.75,onBody*step(.5,fract(q.y*13.+noise(q*6.)*.6)));
 vec3 col;
 if(mat<.5){col=base*(dif>.3?1.:.8);col+=.12*pow(1.-n.z,2.)*step(0.,-n.x);}
 else if(mat<1.5){col=base*(.5+.6*dif)+spec*.35;col*=.85+.15*smoothstep(0.,-.05,d);}
 else if(mat<2.5){float th=1.-H(qq);col=mix(bg,base*(.65+.7*th),.82)+spec*.9+base*.25*th;}
 else{col=base*(.55+.5*dif);col*=.93+.07*noise(q*400.);}
 vec3 c=mix(bg,col,fill(d));
 if(mat<.5||mat>2.5)c=mix(c,INK,stroke(d,.0045)*.85);else c=mix(c,base*.55,stroke(d,.003)*.6);
 if(ex<.01){float t=uW1.z;vec3 ac=t<3.5?mix(uPal[3],uPal[4],.5):mix(uPal[4],vec3(.95,.9,.8),.5);ac*=.7+.4*dif;c=mix(c,ac,fill(ex));c=mix(c,INK,stroke(ex,.0035)*.7);}
 if(d<.0){float ne=uW3.x,er=FR*.15*uW3.y,sp=FR*uW3.z,st=uW3.w;
  vec2 look=vec2((uP.y-.5)*.6+.25*sin(T),.15*cos(T))*er*.45;float blink=step(fract(uPhase*2.+uP.z),.035);
  for(int k=0;k<3;k++){float fk=float(k);if(fk>=ne)break;vec2 cc;float r=er;
   if(ne<1.5){cc=FC+vec2(0.,FR*.05);r=er*1.6;}else if(k<2)cc=FC+vec2((fk*2.-1.)*sp,0.);else{cc=FC+vec2(0.,FR*.45);r=er*.7;}
   vec2 v=q-cc;
   if(blink>.5||(st>2.5&&st<3.5)){vec2 ce=vec2(0.,r*.5);c=mix(c,INK,fill(abs(length(v-ce)-r*.75)-r*.13)*step(v.y,ce.y-r*.25));}
   else if(st>3.5){vec2 ce=vec2(0.,-r*.55);c=mix(c,INK,fill(abs(length(v-ce)-r*.75)-r*.13)*step(ce.y+r*.25,v.y));}
   else if(st>1.5){c=mix(c,vec3(.98),fill(sdE(v,vec2(r*1.15,r*1.25))));c=mix(c,INK,stroke(sdE(v,vec2(r*1.15,r*1.25)),r*.06));
    c=mix(c,mix(uPal[1],uPal[3],.3),fill(length(v-look)-r*.72));c=mix(c,INK,fill(length(v-look)-r*.38));c=mix(c,vec3(1.),fill(length(v-look-vec2(-r*.25,r*.28))-r*.18));}
   else{vec2 rr=st>.5?vec2(r*.72,r*1.35):vec2(r,r*1.12);c=mix(c,INK,fill(sdE(v-look*.4,rr)));
    c=mix(c,vec3(1.),fill(length(v-look*.4-vec2(-rr.x*.32,rr.y*.36))-r*.3));c=mix(c,vec3(1.),fill(length(v-look*.4-vec2(rr.x*.3,-rr.y*.38))-r*.12));}}
  vec2 m=q-(FC-vec2(0.,FR*.3+er*.4));float w=FR*.11;float mo=uW4.x;
  if(mo<.5)c=mix(c,INK,fill(abs(length(m-vec2(0.,w*.9))-w)-w*.16)*step(m.y,w*.5));
  else if(mo<1.5){float o=sdE(m,vec2(w*.8,w*.65*(.85+.15*sin(T*2.))));c=mix(c,INK,fill(o));c=mix(c,vec3(.95,.45,.55),fill(max(o+.002,-(m.y+w*.2))));}
  else if(mo<2.5){for(int k=0;k<2;k++){float s=float(k)*2.-1.;vec2 mm=m-vec2(s*w*.48,w*.45);c=mix(c,INK,fill(abs(length(mm)-w*.48)-w*.14)*step(mm.y,0.));}}
  else c=mix(c,INK,fill(sdE(m,vec2(w*.35,w*.42))));
  float cx=ne<1.5?FR*.5:sp+er*1.1;for(int k=0;k<2;k++){float s=float(k)*2.-1.;c=mix(c,vec3(1.,.45,.55),fill(sdE(q-FC-vec2(s*cx,-er*1.15),vec2(er*.85,er*.5)))*.35);}}
 for(int i=0;i<7;i++){float fi=float(i);vec2 o=(vec2(h11(fi*3.+uSeed.w),h11(fi*7.+uSeed.y))-.5)*vec2(1.5,.9);if(length(o)<.4)continue;
  vec2 v=p-o;float tw=.5+.5*sin(T*2.+fi*2.);float sz=.02+.02*h11(fi*5.);
  c=mix(c,mix(uPal[4],vec3(1.),.6),max(0.,1.-abs(v.x*v.y)*6000.)*smoothstep(sz,0.,length(v))*tw);}
 return c;}
`;

const MAT = ['cel', 'soft', 'gummy', 'plush'];
const EAR = ['', 'round ears', 'pointy ears', 'antennae', 'horns', 'long ears'];
export function creatureConfig(rng, o = {}) {
  const f = (a, b) => rng.float(a, b), headMode = rng.chance(0.55) ? 1 : 0;
  const material = o.material != null ? o.material : rng.int(0, 3);
  const W = [
    f(0.12, 0.24), f(0.1, headMode ? 0.15 : 0.22), f(0.35, 1), f(-0.5, 0.5),
    headMode, f(0.14, 0.2), rng.int(0, 5), f(0.55, 1.25),
    f(-0.4, 0.7), rng.chance(0.65) ? f(0.4, 1) : 0, rng.chance(0.7) ? f(0.4, 1) : 0, rng.chance(0.3) ? 1 : 0,
    o.eyes || rng.pick([2, 2, 2, 2, 1, 3]), f(0.7, 1.35), f(0.25, 0.45), rng.pick([0, 0, 1, 2, 2, 3, 4]),
    rng.int(0, 3), material, rng.int(0, 3), rng.int(0, 3),
  ];
  const p = [rng.next(), rng.next(), rng.next(), rng.next()];
  const desc = [MAT[material], W[4] ? 'big head' : 'one-piece', EAR[W[6]], W[9] ? 'arms' : '', W[10] ? 'legs' : 'blob', W[11] ? 'tail' : '', ['', '1 eye', '2 eyes', '3 eyes'][W[12]]].filter(Boolean).join(' · ');
  return { W, p, desc };
}
