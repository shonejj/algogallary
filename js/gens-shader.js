// Fragment-shader generators. Each defines `vec3 gen()`. Uniforms: uRes,uTime,uPhase(0..1 loop),uSeed,uP,uPal[5]
// T = loop angle (0..TAU), L = (cos T, sin T) for seamless loops.
export const SHADER_GENS = {

aurora: `
vec3 gen(){vec2 p=uv0();vec3 c=uPal[0];
 for(int i=0;i<4;i++){float fi=float(i);
  vec2 o=(vec2(h11(fi*3.1+uSeed.x*7.),h11(fi*5.7+uSeed.y*7.))-.5)*vec2(1.3,.8)+.18*vec2(sin(T+fi*1.7),cos(T+fi*2.3));
  float d=length(p-o);c=mix(c,pal(.25+fi*.22),exp(-d*d*(3.+3.*h11(fi+uSeed.z)))*.85);}
 float r=fbm(vec2(p.x*1.4+L.x*.3,p.y*2.5+L.y*.3)+uSeed.xy*9.);
 float band=smoothstep(.22,0.,abs(p.y-.1-(r-.5)*.9));
 c+=pal(fract(r+.35))*band*.45*(.6+.4*sin(p.x*20.+r*10.+T));
 return c;}`,

mesh: `
vec3 gen(){vec2 p=gl_FragCoord.xy/uRes;
 vec2 q=p+.22*vec2(fbm(p*1.6+uSeed.xy*9.+L*.35),fbm(p*1.6+uSeed.zw*9.-L*.35))-.11;
 vec3 a=mix(uPal[0],uPal[1],smoothstep(0.,1.,q.x));vec3 b=mix(uPal[2],uPal[3],smoothstep(0.,1.,q.x));
 vec3 c=mix(a,b,smoothstep(0.,1.,q.y));
 vec2 hc=vec2(.5+.3*sin(T+uSeed.x*6.),.5+.3*cos(T+uSeed.y*6.));
 c=mix(c,uPal[4],.55*exp(-7.*length(q-hc)));
 return c;}`,

glass: `
vec3 bg(vec2 p){vec3 c=uPal[0];
 for(int i=0;i<4;i++){float fi=float(i);
  vec2 o=(vec2(h11(fi*3.1+uSeed.x*5.),h11(fi*5.7+uSeed.y*5.))-.5)*vec2(1.5,.9)+.16*vec2(sin(T+fi),cos(T+fi*1.3));
  c=mix(c,pal(.3+.22*fi),smoothstep(.48,.0,length(p-o)));}
 return c;}
vec3 gen(){vec2 p=uv0();vec3 c=bg(p);
 for(int k=0;k<3;k++){float fk=float(k);
  vec2 cen=(vec2(h11(fk*9.+uSeed.z*3.),h11(fk*4.+uSeed.w*3.))-.5)*vec2(1.,.55);
  vec2 sz=vec2(.17+.14*h11(fk+uSeed.x*3.),.11+.09*h11(fk*2.+uSeed.y*3.));
  float d=sdBox(p-cen,sz,.045);
  c*=1.-.22*smoothstep(.07,0.,d-.01)*step(0.,d);
  if(d<0.){vec3 s=vec3(0.);
   for(int j=0;j<12;j++){float a=float(j)*.5236;s+=bg(p+vec2(cos(a),sin(a))*.04*(1.+mod(float(j),2.)));}
   s/=12.;c=mix(s,vec3(1.),.13);
   c+=.09*smoothstep(sz.y,-sz.y,p.y-cen.y);
   vec2 l=p-cen+sz-vec2(.035);
   float lines=0.;for(int t=0;t<3;t++){float ft=float(t);
     lines+=fill(sdBox(l-vec2(.13+ft*0.,-.0+ft*-.035)*vec2(1.,1.)-vec2(0.,sz.y*1.5-.03),vec2(.09-.025*ft,.006),.006));}
   c=mix(c,vec3(1.),lines*.55);
   c=mix(c,vec3(1.),.6*fill(length(l-vec2(.03,sz.y*1.5-.03))-.022));}
  c+=vec3(.6)*stroke(d,.0012)*(.35+.65*smoothstep(-sz.y,sz.y,p.y-cen.y));}
 return c;}`,

liquidglass: `
vec3 bgp(vec2 p){vec2 g=floor(p*5.+uSeed.xy*10.);vec2 f=fract(p*5.)-.5;
 vec3 c=pal(fract(g.x*.13+g.y*.27+uSeed.z));
 c=mix(c,uPal[4],fill(length(f)-.18)*.9);
 c=mix(c,uPal[0],stroke(sdBox(f,vec2(.42),.08),.012)*.5);return c;}
float fld(vec2 p){float f=0.;for(int i=0;i<3;i++){float fi=float(i);
 vec2 c=vec2(.45*sin(T+fi*2.1+uSeed.x*6.),.28*cos(T+fi*1.7+uSeed.y*6.));f+=.03/dot(p-c,p-c);}return f;}
vec3 gen(){vec2 p=uv0();float f=fld(p);vec3 c=bgp(p);
 c*=1.-.25*smoothstep(.6,1.,fld(p+vec2(-.02,.03)))*step(f,1.);
 if(f>1.){vec2 e=vec2(.002,0.);vec2 g=vec2(fld(p+e.xy)-fld(p-e.xy),fld(p+e.yx)-fld(p-e.yx));vec2 n=normalize(g);
  float edge=1.-clamp((f-1.)/1.8,0.,1.);float k=.11*edge*edge;
  c=vec3(bgp(p-n*k*1.06).r,bgp(p-n*k).g,bgp(p-n*k*.94).b)*1.04+.04;
  c+=pow(edge,5.)*.55*max(0.,dot(n,normalize(vec2(1.,-1.))));
  c+=.25*pow(edge,10.);}
 return c;}`,

retrowave: `
vec3 gen(){vec2 p=uv0();float hz=-.06;vec3 c=mix(uPal[1],uPal[0],clamp(p.y*1.3+.1,0.,1.));
 vec2 sp=floor(gl_FragCoord.xy/max(2.,uRes.y/400.));c+=step(.996,h21(sp+uSeed.xy*100.))*smoothstep(hz,.6,p.y)*(.5+.5*sin(T*3.+h21(sp)*20.));
 vec2 sc=vec2(.25*(uSeed.x-.5),hz+.2);float r=.27;float d=length(p-sc);
 vec3 sun=mix(uPal[2],uPal[3],clamp((p.y-sc.y)/r*.5+.5,0.,1.));
 float k=clamp((sc.y-p.y)/r,0.,1.);float cut=step(fract(p.y*22.-uPhase*2.),k*.6);
 c+=uPal[2]*exp(-d*3.)*.35;
 if(d<r&&cut<.5)c=sun;
 if(uP.x>.5){float x=p.x;float mh=hz+.2*pow(abs(x),1.2)*(.5+fbm3(vec2(x*4.+uSeed.z*9.,0.)));
  if(p.y<mh&&p.y>hz){c=uPal[0]*1.2;
   float gx=abs(fract(x*18.)-.5);float gy=abs(fract((p.y-hz)/(mh-hz+.001)*5.)-.5);
   c=mix(c,uPal[4],(smoothstep(.06,0.,.5-gx)+smoothstep(.08,0.,.5-gy))*.6*(p.y-hz)/(mh-hz+.001));}}
 if(p.y<hz){float dz=1./(hz-p.y+.002);vec2 g=vec2(p.x*dz*.6,dz*.35+uPhase*2.);
  vec2 w=fwidth(g);vec2 dd=.5-abs(fract(g)-.5);
  float ln=max(1.-smoothstep(0.,w.x*1.6,dd.x),1.-smoothstep(0.,w.y*1.6,dd.y));
  vec3 gc=mix(uPal[0],uPal[1],.35);c=mix(gc,uPal[4],ln*clamp(3./dz,0.,1.));
  c+=uPal[2]*exp(-(hz-p.y)*14.)*.6;}
 c+=uPal[2]*exp(-abs(p.y-hz)*30.)*.3;
 return c;}`,

aero: `
vec3 gen(){vec2 p=uv0();vec3 c=mix(uPal[4],uPal[2],clamp(p.y+.55,0.,1.));
 vec2 sp=vec2(-.55+.3*uSeed.x,.55);vec2 d=p-sp;float a=atan(d.y,d.x);
 c+=.14*pow(.5+.5*sin(a*14.+T),3.)*smoothstep(1.7,0.,length(d));c+=.55*exp(-length(d)*3.2);
 float cl=fbm(vec2(p.x*1.4+uPhase*2.,p.y*3.)+uSeed.zw*9.);c=mix(c,vec3(1.),smoothstep(.55,.75,cl)*smoothstep(-.1,.3,p.y)*.8);
 float h1=-.22+.08*sin(p.x*2.+uSeed.x*6.)+.05*sin(p.x*5.+uSeed.y*6.);
 float h2=-.36+.06*sin(p.x*3.+uSeed.z*6.+1.);
 if(p.y<h1){c=mix(uPal[3],uPal[1],clamp((h1-p.y)*3.,0.,1.));c+=.35*smoothstep(.06,0.,h1-p.y);}
 if(p.y<h2){c=mix(uPal[1],uPal[0],clamp((h2-p.y)*3.,0.,1.));c+=.28*smoothstep(.04,0.,h2-p.y);}
 for(int i=0;i<12;i++){float fi=float(i);float r=.025+.065*h11(fi+uSeed.w*9.);
  vec2 bc=vec2((h11(fi*3.3+uSeed.x)-.5)*1.7+.04*sin(T+fi),fract(h11(fi*7.1+uSeed.y)+uPhase)*1.8-.9);
  vec2 q=(p-bc)/r;float l=length(q);
  if(l<1.){float rim=smoothstep(.65,1.,l);c=mix(c,c*1.08+.08,.6)+rim*.4*vec3(.85,.97,1.);
   c+=.75*smoothstep(.32,.0,length(q-vec2(-.35,.4)));c+=vec3(.4,1.,.8)*.15*smoothstep(.3,0.,length(q-vec2(.3,-.45)));}}
 return c;}`,

chrome: `
float mf(vec2 p){float f=0.;for(int i=0;i<5;i++){float fi=float(i);
 vec2 c=vec2(.42*sin(T+fi*1.3+uSeed.x*6.),.28*cos(T+fi*2.1+uSeed.y*6.));f+=.018*(1.+h11(fi+uSeed.z))/dot(p-c,p-c);}return f;}
float hh(vec2 p){float f=mf(p);return f>1.?sqrt(1.-1./f):0.;}
vec3 env(vec3 r){float y=r.y;vec3 c=mix(uPal[1],uPal[4],smoothstep(-.05,.5,y));
 c=mix(c,uPal[0],smoothstep(.0,-.25,y));c+=uPal[2]*smoothstep(.06,0.,abs(y+.02))*.9;c+=uPal[3]*smoothstep(.2,0.,abs(r.x-.4))*.35;return c;}
float star(vec2 q,float s){q/=s;return max(0.,1.-abs(q.x*q.y)*60.)*smoothstep(1.,0.,length(q));}
vec3 gen(){vec2 p=uv0();vec3 c=mix(uPal[1]*.6,uPal[0],length(p)*1.2);
 for(int i=0;i<7;i++){float fi=float(i);vec2 o=(vec2(h11(fi*4.+uSeed.w),h11(fi*9.+uSeed.x))-.5)*vec2(1.7,1.);
  c+=uPal[4]*star(p-o,.05+.06*h11(fi))*(.5+.5*sin(T*2.+fi*2.));}
 float f=mf(p);
 if(f>1.){vec2 e=vec2(.002,0.);vec2 g=vec2(hh(p+e.xy)-hh(p-e.xy),hh(p+e.yx)-hh(p-e.yx))/.004;
  vec3 n=normalize(vec3(-g*.12,1.));vec3 r=reflect(vec3(0.,0.,-1.),n);
  c=env(r);c+=pow(max(0.,dot(r,normalize(vec3(-.4,.6,.7)))),30.)*1.2;}
 c+=uPal[3]*.4*smoothstep(.12,0.,abs(f-.9))*step(f,1.);
 return c;}`,

holo: `
vec3 gen(){vec2 p=uv0()*1.3;vec2 q=p+uSeed.xy*7.;
 float h=fbm(q*1.1+1.4*vec2(fbm(q+L*.25),fbm(q+3.1-L*.25)));
 vec2 dh=vec2(dFdx(h),dFdy(h))*min(uRes.x,uRes.y)*.35;vec3 n=normalize(vec3(-dh,1.));
 float th=h*2.6+n.x*.7+n.y*.5+uPhase+p.x*.3;
 vec3 ir=.5+.5*cos(TAU*(th+vec3(0.,.33,.67)));
 vec3 c=mix(ir,pal(h),.4+.2*uP.y);c=mix(c,vec3(1.),.22*pow(1.-n.z,1.5));
 c+=pow(max(0.,dot(n,normalize(vec3(.3,.5,.8)))),24.)*.45;
 return c;}`,

orbs: `
vec3 gen(){vec2 p=uv0();vec3 c=mix(uPal[0],uPal[1],fbm(p*2.+uSeed.xy*5.+L*.2)*.9);
 for(int i=0;i<6;i++){float fi=float(i);
  vec2 o=(vec2(h11(fi*2.7+uSeed.x),h11(fi*5.3+uSeed.y))-.5)*vec2(1.5,.9)+.05*vec2(sin(T+fi),cos(T+fi*2.));
  float r=.05+.12*h11(fi*8.1+uSeed.z);float d=length(p-o)/r;
  vec3 ir=.5+.5*cos(TAU*(d*.5+fi*.2+uPhase+vec3(0.,.33,.67)));vec3 oc=mix(pal(.55+.08*fi),ir,.35);
  c+=oc*exp(-d*d*1.6)*.95+oc*.22*exp(-d*1.1);
  c=mix(c,vec3(1.),smoothstep(.28,0.,length((p-o)/r-vec2(-.3,.35)))*.45*step(d,1.));}
 vec2 g=floor(gl_FragCoord.xy/max(2.,uRes.y/360.));c+=step(.995,h21(g+uSeed.zw*50.))*.6*(.5+.5*sin(T*2.+h21(g)*30.));
 return c;}`,

cyber: `
vec3 gen(){vec2 u=gl_FragCoord.xy/uRes;float ar=uRes.x/uRes.y;vec2 p=vec2(u.x*ar,u.y);
 vec3 c=mix(uPal[2]*.8,uPal[0],pow(u.y,.7));c+=uPal[3]*.25*exp(-abs(u.y-.3)*6.);
 for(int l=0;l<4;l++){float fl=float(l);float dep=3.-fl;float sc=7.+dep*6.;
  float x=p.x*sc+uSeed.x*100.+fl*37.;float id=floor(x);float fx=fract(x);
  float h=.12+.5*h11(id+fl*13.+uSeed.y*50.)*(1.-dep*.12)+dep*.0;
  if(u.y<h&&fx>.06&&fx<.94){vec3 bc=mix(uPal[0]*1.1,uPal[1]*.7,dep*.18);
   vec2 w=vec2(fract(fx*5.),fract(u.y*sc*2.2));vec2 wid=vec2(floor(fx*5.),floor(u.y*sc*2.2));
   float lit=step(.62,h21(wid+id*7.+fl))*step(.25,w.x)*step(w.x,.75)*step(.3,w.y)*step(w.y,.8);
   bc+=lit*pal(.7+.3*h21(wid+id))*(.6+.4*sin(T+h21(wid)*20.))*.8;
   if(h11(id*3.+fl)>.82&&abs(fx-.5)<.08&&u.y>h-.25&&u.y<h-.05)bc=mix(bc,palAt(2.+floor(h11(id)*2.+.5)),.9);
   c=mix(c,bc,1.-dep*.2);c=mix(c,uPal[2]*.5,dep*.08);}}
 float yy=mod(gl_FragCoord.y+uPhase*uRes.y*3.+gl_FragCoord.x*.3,uRes.y);
 float rn=step(.985,h21(vec2(floor(gl_FragCoord.x/2.),floor(yy/(uRes.y*.04)))));
 c+=rn*.18*uPal[4];
 return c;}`,

solar: `
vec3 gen(){vec2 p=uv0();vec3 c=mix(uPal[3],uPal[4],clamp(p.y+.3,0.,1.));
 vec2 sp=vec2(.5*(uSeed.x-.5),.22+.1*uSeed.y);float sd=length(p-sp);
 float a=atan(p.y-sp.y,p.x-sp.x);c+=.08*step(.5,fract(a*12./TAU+uPhase))*smoothstep(1.2,.1,sd);
 c+=uPal[3]*.45*exp(-sd*4.);c=mix(c,vec3(1.,.98,.88),fill(sd-.1));
 for(int i=0;i<4;i++){float fi=float(i);float base=.0-fi*.14;float freq=2.+fi*1.3;
  float hgt=base+.06*sin(p.x*freq+uSeed.z*6.+fi)+.04*sin(p.x*freq*2.3+fi*4.);
  vec3 hc=mix(pal(.75-fi*.18),uPal[4],.45-fi*.15);
  if(fi==1.){for(int k=0;k<2;k++){float tx=(float(k)-.5)*.8+.2*(uSeed.w-.5);float th=base+.06*sin(tx*freq+uSeed.z*6.+fi)+.04*sin(tx*freq*2.3+fi*4.);
    vec2 top=vec2(tx,th+.32);c=mix(c,vec3(.97),fill(sdSeg(p,vec2(tx,th),top)-.004));
    for(int b=0;b<3;b++){float ang=T+float(b)*TAU/3.+float(k);c=mix(c,vec3(.97),fill(sdSeg(p,top,top+vec2(cos(ang),sin(ang))*.12)-.004));}}}
  float cell=floor(p.x*(4.+fi*3.)+fi*5.);float cx=(cell+.5)/(4.+fi*3.)-fi*5./(4.+fi*3.);
  float tr=.035+.025*h11(cell+fi*10.);float ty=base+.06*sin(cx*freq+uSeed.z*6.+fi)+.04*sin(cx*freq*2.3+fi*4.)+tr*.8;
  float tree=step(.45,h11(cell*1.7+fi+uSeed.x*20.))*fill(length(p-vec2(cx+.008*sin(T+cell),ty))-tr);
  float m=max(fill(p.y-hgt),tree);c=mix(c,hc*(1.-.15*tree*smoothstep(0.,tr,p.y-ty+tr*.3)),m);}
 for(int i=0;i<16;i++){float fi=float(i);vec2 o=vec2(fract(h11(fi*3.+uSeed.x)+uPhase*(fi<8.?1.:2.))*2.2-1.1,(h11(fi*7.+uSeed.y)-.5)*.8+.05*sin(T*2.+fi));
  c=mix(c,vec3(1.,.95,.7),fill(length(p-o)-.004)*.8);}
 return c;}`,

riso: `
float lay(vec2 p,float s){float v=0.;
 for(int i=0;i<4;i++){float fi=float(i)+s*10.;vec2 o=(vec2(h11(fi*3.+uSeed.x*9.),h11(fi*5.+uSeed.y*9.))-.5)*vec2(1.2,.8);
  float r=.1+.22*h11(fi*7.+uSeed.z*9.);float tone=.35+.65*smoothstep(-r,r,(p-o).y*(h11(fi)>.5?1.:-1.));
  float sh=h11(fi*11.+uSeed.w*9.)>.6?sdBox(p-o,vec2(r*.9),r*.2):length(p-o)-r;
  v=max(v,fill(sh)*tone);}
 float stripe=step(.5,fract((p.x+p.y*(s>.5?-1.:1.))*9.))*fill(abs(p.y-(s-.5)*.6)-.07);
 return max(v,stripe*.9);}
float ht(vec2 fc,float v,float ang,float cell){vec2 q=rot(ang)*fc/cell;float r=sqrt(clamp(v,0.,1.))*.66;return smoothstep(r+.1,r-.1,length(fract(q)-.5));}
vec3 gen(){vec2 p=uv0();vec2 fc=gl_FragCoord.xy;float cell=min(uRes.x,uRes.y)/150.;
 vec2 mis=vec2(.006,-.004)+.003*L;
 float a=ht(fc,lay(p+mis,0.),.26,cell);float b=ht(fc,lay(p,1.),1.13,cell);
 vec3 paper=uPal[4]*(.95+.05*h21(floor(fc)));
 vec3 c=paper*mix(vec3(1.),uPal[1],a*.92)*mix(vec3(1.),uPal[2],b*.88);
 return c;}`,

enso: `
vec3 gen(){vec2 p=uv0();vec2 fc=gl_FragCoord.xy;float sk=min(uRes.x,uRes.y)/900.;
 vec3 paper=uPal[4]*(.93+.07*fbm(fc*.012/sk))*(.97+.03*noise(fc*.6/sk));
 vec2 w=p+.025*vec2(fbm(p*7.+uSeed.xy*9.),fbm(p*7.+3.+uSeed.zw*9.))-.0125+.004*L;
 float ang=atan(w.y,w.x);float t=fract(ang/TAU+.5-uSeed.x);
 float R=.3+.025*sin(ang*2.+uSeed.y*6.);
 float th=.065*(1.-t*.75)*smoothstep(0.,.03,t)*smoothstep(.93,.84,t)+.002;
 float d=abs(length(w)-R)-th;
 float streak=noise(vec2(t*5.,(length(w)-R)/th*3.)+uSeed.x*20.);
 float dry=smoothstep(.45,.9,t)*step(.55,streak);
 float ink=fill(d)*(1.-dry*.85);float halo=smoothstep(.025,0.,d)*.12;
 vec3 c=mix(paper,uPal[0],clamp(ink*.94+halo,0.,1.));
 for(int i=0;i<10;i++){float fi=float(i);vec2 o=vec2(cos(uSeed.x*TAU+fi*.3),sin(uSeed.x*TAU+fi*.3))*(R+.05+.1*h11(fi+uSeed.z))+(vec2(h11(fi*3.),h11(fi*5.))-.5)*.05;
  c=mix(c,uPal[0],fill(length(p-o)-.003-.008*h11(fi*9.))*.9);}
 vec2 sp=p-vec2(.36,-.3);float sq=sdBox(sp,vec2(.035),.004);
 float sealTex=step(.32,noise(fc*.25/sk));float glyph=step(.012,abs(sp.x))*step(.012,abs(sp.y+.01))+step(.025,abs(sp.y));
 c=mix(c,uPal[1],fill(sq)*sealTex*min(glyph,1.)*.92);
 return c;}`,

inkscape: `
vec3 gen(){vec2 p=uv0();vec2 fc=gl_FragCoord.xy;float sk=min(uRes.x,uRes.y)/900.;
 vec3 paper=uPal[4]*(.93+.07*fbm(fc*.01/sk));vec3 c=paper;
 vec2 sp=vec2(.3*(uSeed.x-.5)*2.,.25);c=mix(c,uPal[1],fill(length(p-sp)-.07)*.85);
 for(int i=0;i<5;i++){float fi=float(i);float base=.22-fi*.14;
  float hgt=base+.32*(fbm(vec2(p.x*(1.3+fi*.5)+uSeed.x*10.+fi*3.,fi*1.7))-.5)*(1.+fi*.25);
  float ins=fill(p.y-hgt);float depth=smoothstep(0.,.22,hgt-p.y);
  float tone=mix(.22,.92,fi/4.)*(1.-depth*.65)*(.85+.15*fbm(p*30.+fi));
  c=mix(c,uPal[0],ins*tone);
  c=mix(c,paper,.35*smoothstep(.05,0.,abs(p.y-base+.08+.02*sin(p.x*4.+T+fi)))*(1.-fi*.2));}
 return c;}`,

marble: `
vec3 gen(){vec2 p=uv0()*1.4+uSeed.xy*4.;vec2 q=vec2(fbm(p+L*.15),fbm(p+5.2-L*.15));
 vec2 r=vec2(fbm(p+3.5*q+1.7),fbm(p+3.5*q+9.2));
 float v=sin((p.x+3.*r.x+2.*r.y)*5.+uSeed.z*6.)*.5+.5;float v2=fbm(p+4.*r);
 vec3 c=pal(fract(v*.55+v2*.6));
 c=mix(c,uPal[4],stroke(v-.5,.025)*.85);c=mix(c,uPal[0],stroke(v2-.55,.008)*.4);
 return c;}`,

watercolor: `
vec3 gen(){vec2 p=uv0();vec2 fc=gl_FragCoord.xy;float sk=min(uRes.x,uRes.y)/900.;
 vec3 paper=vec3(.985,.97,.94)*(.94+.06*fbm(fc*.02/sk));vec3 c=paper;
 for(int i=0;i<7;i++){float fi=float(i);
  vec2 o=(vec2(h11(fi*3.+uSeed.x*9.),h11(fi*7.+uSeed.y*9.))-.5)*vec2(1.3,.8);float r=.12+.18*h11(fi*5.+uSeed.z);
  float n=fbm(p*3.+fi*7.+uSeed.xy*9.+L*.08);float d=length(p-o)-r+(n-.5)*.28;
  float m=smoothstep(.02,-.03,d);float edge=smoothstep(.035,0.,abs(d))*.55;
  vec3 pig=pal(.2+.8*h11(fi*3.+uSeed.w));float gran=.75+.5*noise(fc*.4/sk+fi*10.);
  c*=mix(vec3(1.),pig,clamp(m*(.32+edge)*gran,0.,1.));}
 return c;}`,

opart: `
vec3 gen(){vec2 p=uv0();float k=25.+40.*uSeed.x;float v;
 if(uP.x<.33){vec2 c1=vec2(.18*sin(T),.1*cos(T));vec2 c2=-c1+vec2(.12*(uSeed.y-.5),0.);
  v=step(0.,sin(length(p-c1)*k)*sin(length(p-c2)*k));}
 else if(uP.x<.66){vec2 q=p*(1.+.7*exp(-dot(p-.15*L,p-.15*L)*5.));v=step(0.,sin(q.x*k*.5)*sin(q.y*k*.5));}
 else{float a=.05+.15*uSeed.z+.05*sin(T);v=step(0.,sin(p.x*k*1.3)*sin((rot(a)*p).x*k*1.3+.0))*0.;
  v=step(.0,sin(p.x*k*1.3))*1.;float v2=step(0.,sin((rot(a)*p).x*k*1.3));v=abs(v-v2);}
 return mix(uPal[0],uPal[4],v);}`,

truchet: `
vec3 gen(){float sc=5.+7.*uSeed.x;vec2 p=uv0()*sc+uSeed.yz*50.;vec2 id=floor(p);vec2 f=fract(p)-.5;
 float r=h21(id);if(r>.5)f.x=-f.x;
 float d;if(uP.x<.5){d=min(abs(length(f-.5)-.5),abs(length(f+.5)-.5));}
 else{d=abs(f.x+f.y)*.7071;}
 float w=.14+.05*sin(T+(id.x+id.y)*.4);float e=fwidth(d);
 float ln=smoothstep(w+e,w-e,d);float tube=.75+.25*cos(clamp(d/w,0.,1.)*1.57);
 vec3 bg=mix(uPal[0],uPal[1],.25+.25*h21(id+3.));
 return mix(bg,pal(.5+.5*h21(id+7.))*tube,ln);}`,

voronoi: `
vec3 vor(vec2 p){vec2 n=floor(p),f=fract(p);float d1=8.,d2=8.;float id=0.;
 for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 g=vec2(float(i),float(j));vec2 o=h22(n+g);o=.5+.4*sin(T+TAU*o);
  float d=length(g+o-f);if(d<d1){d2=d1;d1=d;id=h21(n+g);}else if(d<d2)d2=d;}
 return vec3(d1,d2,id);}
vec3 gen(){vec2 p=uv0()*(4.+5.*uSeed.x)+uSeed.yz*30.;vec3 v=vor(p);float edge=v.y-v.x;vec3 c;
 if(uP.x<.5){c=pal(.25+.75*v.z)*(.75+.35*(1.-v.x));c=mix(c,uPal[0]*.4,smoothstep(.07,.03,edge));
  c+=uPal[4]*.15*smoothstep(.4,0.,length(v.xy-.25));}
 else{c=mix(uPal[0],uPal[1],.3);c+=pal(.4+.6*v.z)*exp(-edge*14.)*1.1;c+=uPal[4]*fill((v.x-.12)*pxs()*0.+(v.x-.12)*.02)*.7*step(.5,v.z);}
 return c;}`,

julia: `
vec3 gen(){vec2 p=uv0()*(2.6-uSeed.x*.9);p*=rot(uSeed.w*TAU);
 float a=uSeed.y*TAU+.12*sin(T);vec2 cc=.7885*vec2(cos(a),sin(a));
 vec2 z=p;float it=0.;
 for(int i=0;i<140;i++){z=vec2(z.x*z.x-z.y*z.y,2.*z.x*z.y)+cc;if(dot(z,z)>64.)break;it+=1.;}
 if(it>139.)return uPal[0];
 float sm=it-log2(log2(dot(z,z)))+4.;
 return palc(sqrt(sm/140.)*1.6+uSeed.z+uPhase);}`,

turing: `
vec3 gen(){vec2 p=uv0()*(3.+4.*uSeed.x)+uSeed.yz*20.;
 vec2 w=p+.9*vec2(fbm3(p*.6+L*.15),fbm3(p*.6+7.-L*.15));
 float n=noise(w*1.5)*.6+noise(w*3.1)*.4;float v=sin(n*(28.+10.*uSeed.w));
 float m=smoothstep(-.18,.18,v);vec3 c=mix(uPal[0],uPal[3],m);
 c=mix(c,uPal[4],smoothstep(.85,1.,v)*.4);return c;}`,

warp: `
vec3 gen(){vec2 p=uv0()*1.8+uSeed.xy*10.;vec2 q=vec2(fbm(p+L*.3),fbm(p+vec2(5.2,1.3)));
 vec2 r=vec2(fbm(p+4.*q+vec2(1.7,9.2)+L*.2),fbm(p+4.*q+vec2(8.3,2.8)));float f=fbm(p+4.*r);
 vec3 c=mix(uPal[0],uPal[1],clamp(f*f*3.,0.,1.));c=mix(c,uPal[2],clamp(length(q)*.9,0.,1.));
 c=mix(c,uPal[3],clamp(r.x,0.,1.)*.6);c=mix(c,uPal[4],smoothstep(.7,1.,f));
 return c*(f*f*f+.6*f*f+.5*f)*1.7;}`,

plasma: `
vec3 gen(){vec2 p=uv0()*(3.+3.*uSeed.x);
 float v=sin(p.x+T)+sin(p.y*1.3-T)+sin((p.x+p.y)*.8+T+uSeed.y*6.)+sin(length(p+vec2(sin(T),cos(T))*1.5)*2.);
 if(uP.x>.5)return .5+.5*cos(TAU*(v*.2+vec3(0.,.33,.67)+uSeed.z));
 return palc(v*.18+uSeed.z);}`,

metaballs: `
float mb(vec2 p){float f=0.;for(int i=0;i<7;i++){float fi=float(i);
 vec2 c=vec2(.55*sin(T+fi*1.9+uSeed.x*6.)*(.4+.6*h11(fi)),.4*sin(T*(fi<3.?1.:2.)+fi*2.7+uSeed.y*6.));
 f+=.012*(1.+h11(fi+uSeed.z)*1.5)/dot(p-c,p-c);}return f;}
vec3 gen(){vec2 p=uv0();vec3 bg=mix(uPal[0],uPal[1],p.y+.5);float f=mb(p);
 vec3 c=bg+uPal[3]*.25*smoothstep(.3,1.,f);
 if(f>1.){c=mix(uPal[2],uPal[3],clamp(p.y+.5+(f-1.)*.05,0.,1.));c+=uPal[4]*.35*smoothstep(1.3,1.,f);}
 return c;}`,

raymarch: `
float map(vec3 p){vec3 q=p;q.xz*=rot(T);q.xy*=rot(uSeed.x*3.);
 float s=length(p-vec3(.55*sin(T),.2*cos(T),0.))-.42;
 float t=length(vec2(length(q.xz)-.7,q.y))-.14;
 vec3 b=q;b.yz*=rot(T+uSeed.y*3.);float bx=length(max(abs(b)-vec3(.28),0.))-.06;
 return smin(smin(s,t,.3),bx,.3);}
vec3 gen(){vec2 p=uv0();vec3 ro=vec3(0.,0.,2.6);vec3 rd=normalize(vec3(p,-1.6));
 vec3 c=mix(uPal[1],uPal[0],length(p)*1.2);float t=0.;bool hit=false;
 for(int i=0;i<64;i++){float d=map(ro+rd*t);if(d<.002){hit=true;break;}t+=d;if(t>6.)break;}
 if(hit){vec3 pos=ro+rd*t;vec2 e=vec2(.002,-.002);
  vec3 n=normalize(e.xyy*map(pos+e.xyy)+e.yyx*map(pos+e.yyx)+e.yxy*map(pos+e.yxy)+e.xxx*map(pos+e.xxx));
  vec3 ld=normalize(vec3(.6,.8,.5));float dif=max(dot(n,ld),0.);float fr=pow(1.-max(dot(n,-rd),0.),3.);
  float ao=clamp(map(pos+n*.15)/.15,0.,1.);
  c=mix(uPal[2],uPal[3],n.y*.5+.5)*(.25+.85*dif)*(.5+.5*ao)+uPal[4]*fr*.7;
  c+=pow(max(dot(reflect(-ld,n),-rd),0.),40.)*.6;}
 return c;}`,

nebula: `
vec3 gen(){vec2 p=uv0();vec2 q=p*1.5+uSeed.xy*10.;
 float n=fbm(q+fbm(q*2.+L*.15)*1.5);float n2=fbm(q*3.-3.+L*.1);
 vec3 c=uPal[0];c+=pal(.25+n*.7)*pow(n,2.2)*1.9;c+=uPal[3]*pow(n2,4.)*1.4;
 c*=.55+.45*smoothstep(.3,.6,fbm(q*2.5+9.));
 vec2 g=floor(gl_FragCoord.xy/max(1.,uRes.y/700.));float s=h21(g+uSeed.zw*40.);
 c+=step(.997,s)*(.6+.4*sin(T*2.+s*50.));
 vec2 bs=(vec2(h11(uSeed.w*9.),h11(uSeed.x*9.))-.5)*vec2(1.2,.7);vec2 bq=p-bs;
 c+=uPal[4]*(.003/dot(bq,bq)*.4+max(0.,1.-abs(bq.x*bq.y)*3000.)*smoothstep(.25,0.,length(bq)));
 return c;}`,

caustics: `
vec3 gen(){vec2 p=mod(uv0()*TAU*1.2+uSeed.xy*20.,TAU)-250.;vec2 i=p;float c=1.;float inten=.005;
 for(int n=0;n<5;n++){float t=T+float(n)*1.7;
  i=p+vec2(cos(t-i.x)+sin(t+i.y),sin(t-i.y)+cos(t+i.x));
  c+=1./length(vec2(p.x/(sin(i.x+t)/inten),p.y/(cos(i.y+t)/inten)));}
 c/=5.;c=1.17-pow(c,1.4);float v=pow(abs(c),8.);
 return mix(mix(uPal[1],uPal[2],uv0().y+.5),uPal[4],clamp(v,0.,1.));}`,

topo: `
vec3 gen(){vec2 p=uv0()*1.8+uSeed.xy*10.;float h=fbm(p+.25*L)*.7+.3*fbm(p*2.3+3.);
 float k=14.+12.*uSeed.z;float v=h*k;float w=fwidth(v);float dd=min(fract(v),1.-fract(v));
 float ln=1.-smoothstep(0.,w*1.4,dd);float major=step(.5,1.-abs(mod(floor(v+.5),5.)-0.));
 vec3 bg=uP.x>.5?pal(h*.9):mix(uPal[0],uPal[1],h*.6);
 return mix(bg,uPal[4],ln*(.55+.45*major));}`,

ridges: `
vec3 gen(){vec2 p=uv0();vec3 c=uPal[0];
 for(int i=0;i<44;i++){float fi=float(i);float y0=.42-fi/44.*.86;
  float env=exp(-pow(p.x*2.4,2.)*2.);
  float n=fbm3(vec2(p.x*5.+uSeed.x*20.,fi*.55+uSeed.y*10.)+.25*L);
  float d=y0+.2*env*n*n*1.8+.004*noise(vec2(p.x*90.,fi));
  if(abs(p.x)<.42){if(p.y<d)c=uPal[0];c=mix(c,uPal[4],stroke(p.y-d,.0018));}}
 return c;}`,

kaleido: `
vec3 gen(){vec2 p=uv0();float n=6.+2.*floor(uSeed.x*5.);float a=atan(p.y,p.x)+T/n;float r=length(p);
 a=mod(a,TAU/n);a=abs(a-PI/n);vec2 q=r*vec2(cos(a),sin(a));
 q=q*3.+uSeed.yz*5.;float v=fbm(q+L*.2);vec3 c;
 if(uP.x>.5){float m=smoothstep(.47,.5,v)*(1.-smoothstep(.56,.59,v));float holes=step(.5,fract(r*10.+v*2.));
  c=mix(uPal[0],uPal[3],m+.4*holes*smoothstep(.6,.2,r));c=mix(c,uPal[2],stroke(fract(r*5.)-.5,.01)*.6);}
 else{c=palc(v*1.5+r*.6);c*=.65+.35*smoothstep(.0,.04,abs(fract(r*6.+v)-.5)-.08);}
 return c*smoothstep(.85,.3,r*.9)+uPal[0]*(1.-smoothstep(.85,.3,r*.9))*.8;}`,

deco: `
vec3 gen(){float sc=3.+3.*uSeed.x;vec2 p=uv0()*sc;p.y+=uPhase;
 vec2 g=p;g.x+=.5*mod(floor(g.y),2.);vec2 id=floor(g);vec2 f=fract(g)-vec2(.5,0.);
 float r=length(f);float a=atan(f.x,f.y);vec3 c=uPal[0];
 if(r<.5){c=mix(uPal[1],uPal[2],r*1.6);
  float rays=stroke(fract(a*(5.+floor(uSeed.y*4.))/PI)-.5,.06);float arcs=stroke(fract(r*7.)-.5,.06);
  c=mix(c,uPal[3],max(rays*step(.12,r),arcs)*.95);}
 c=mix(c,uPal[4],stroke(r-.5,.025));
 return c;}`,

lowpoly: `
float hgt(vec2 v){return fbm3(v*.35+uSeed.xy*9.+L*.15);}
vec3 gen(){float sc=6.+6.*uSeed.x;vec2 p=uv0()*sc;const float K1=.366025404;const float K2=.211324865;
 vec2 i=floor(p+(p.x+p.y)*K1);vec2 a=p-i+(i.x+i.y)*K2;vec2 o=(a.x>a.y)?vec2(1.,0.):vec2(0.,1.);
 vec2 v0=i,v1=i+o,v2=i+1.;
 vec2 u0=v0-(v0.x+v0.y)*K2,u1=v1-(v1.x+v1.y)*K2,u2=v2-(v2.x+v2.y)*K2;
 vec3 P0=vec3(u0,hgt(u0)*2.5),P1=vec3(u1,hgt(u1)*2.5),P2=vec3(u2,hgt(u2)*2.5);
 vec3 n=normalize(cross(P1-P0,P2-P0));if(n.z<0.)n=-n;
 float li=dot(n,normalize(vec3(.4,.5,.75)));vec2 cen=(u0+u1+u2)/3.;
 return pal(clamp(cen.y/sc*.8+.5+(P0.z+P1.z+P2.z)/9.-.25,0.,1.))*(.55+.55*li);}`,

landscape: `
float ridge(float x,float fi){return -.05-fi*.12+.18*(fbm3(vec2(x*(1.2+fi*.7)+uSeed.x*20.+fi*7.,fi))-.4)*(1.+fi*.3);}
vec3 gen(){vec2 p=uv0();vec3 c=mix(uPal[3],uPal[4],clamp(p.y*1.2+.3,0.,1.));
 vec2 sp=vec2(.6*(uSeed.y-.5),.12+.15*uSeed.z);float sd=length(p-sp);
 c+=uPal[2]*exp(-sd*4.)*.4;c=mix(c,mix(uPal[4],uPal[2],.3),fill(sd-.11));
 float cl=fbm3(vec2(p.x*2.+uPhase*2.,p.y*6.)+uSeed.zw*9.);c=mix(c,uPal[4],smoothstep(.6,.72,cl)*smoothstep(0.,.3,p.y)*.9);
 for(int i=0;i<4;i++){float fi=float(i);float h=ridge(p.x,fi);
  vec3 lc=mix(pal(.55-fi*.17),c,.0);lc=mix(lc,uPal[3],.35*(1.-fi/3.));
  c=mix(c,lc*(1.-.12*smoothstep(0.,.15,h-p.y)),fill(p.y-h));}
 return c;}`,

sunburst: `
vec3 gen(){vec2 p=uv0()-vec2(.3,.1)*(uSeed.xy-.5);float a=atan(p.y,p.x);float r=length(p);
 float n=10.+2.*floor(uSeed.z*8.);float ray=step(.5,fract(a*n/TAU+uPhase));
 vec3 c=mix(uPal[2],uPal[3],ray);c=mix(c,uPal[1],fill(r-.3));c=mix(c,uPal[4],fill(r-.24));
 c=mix(c,uPal[0],stroke(r-.3,.008)+stroke(r-.24,.006));
 for(int i=0;i<5;i++){float fi=float(i);vec2 o=(vec2(h11(fi*3.+uSeed.w),h11(fi*5.+uSeed.x))-.5)*vec2(1.6,.9);
  float s=.03+.05*h11(fi*7.);float st=length(o)>.4?1.:0.;
  vec2 q=rot(T+fi)*(p-o);float ang=atan(q.y,q.x);float sr=s*(.6+.4*cos(ang*5.));
  c=mix(c,uPal[4],fill(length(q)-sr)*st);c=mix(c,uPal[0],stroke(length(q)-sr,.004)*st);}
 return c;}`,

neumorph: `
float scene(vec2 p,out float inset){inset=0.;float d=1e3;
 for(int i=0;i<5;i++){float fi=float(i);vec2 o=(vec2(h11(fi*3.+uSeed.x*7.),h11(fi*5.+uSeed.y*7.))-.5)*vec2(1.2,.7);
  float t=h11(fi*9.+uSeed.z);float s=.06+.08*h11(fi*2.);float dd;
  if(t<.33)dd=length(p-o)-s;else if(t<.66)dd=sdBox(p-o,vec2(s*1.6,s*.5),s*.5);else dd=sdBox(p-o,vec2(s),s*.35);
  if(dd<d){d=dd;inset=step(.6,h11(fi*13.+uSeed.w));}}return d;}
vec3 gen(){vec2 p=uv0();vec3 base=uPal[2];float ins;float d=scene(p,ins);vec2 o=vec2(.018,-.018);
 float il;float dl=scene(p+o,il);float dd2=scene(p-o,il);
 vec3 c=base;
 if(d>0.){c+=.13*exp(-max(dl,0.)*35.)*step(0.,dl);c-=.16*exp(-max(dd2,0.)*35.)*step(0.,dd2);}
 else{if(ins>.5){c-=.12*smoothstep(-.03,0.,-dl)*0.;c-=.14*(1.-smoothstep(0.,.04,-dl));c+=.1*(1.-smoothstep(0.,.04,-dd2));}
  else{c+=.05*smoothstep(.05,-.05,p.y);}}
 c=mix(c,uPal[3],fill(d+.03)*step(.5,ins)*0.);
 return c;}`,

clay: `
float sc(vec2 p){float d=1e3;for(int i=0;i<6;i++){float fi=float(i);
 vec2 o=(vec2(h11(fi*3.+uSeed.x*7.),h11(fi*5.+uSeed.y*7.))-.5)*vec2(1.,.6)+.03*vec2(sin(T+fi),cos(T*2.+fi));
 d=smin(d,length(p-o)-.07-.09*h11(fi*2.+uSeed.z),.12);}return d;}
float hh(vec2 p){float d=sc(p);return d<0.?sqrt(clamp(-d*8.,0.,1.)):0.;}
vec3 gen(){vec2 p=uv0();vec3 bg=mix(uPal[4],uPal[3],p.y+.5);float d=sc(p);
 vec3 c=bg*(1.-.25*smoothstep(.08,0.,sc(p+vec2(-.03,.05)))*step(0.,d));
 if(d<0.){vec2 e=vec2(.003,0.);vec2 g=vec2(hh(p+e.xy)-hh(p-e.xy),hh(p+e.yx)-hh(p-e.yx))/.006;
  vec3 n=normalize(vec3(-g*.08,1.));vec3 ld=normalize(vec3(-.4,.6,.7));float dif=max(dot(n,ld),0.);
  float k=h21(floor(p*0.)+1.);vec3 base=pal(.15+.6*fract(h21(floor((p+2.)*1.6))+uSeed.w));
  if(uP.x>.5){vec3 jel=mix(base*1.15,base*.55,hh(p));c=jel*(.55+.6*dif)+pow(max(dot(reflect(-ld,n),vec3(0.,0.,1.)),0.),40.)*.9;
   c+=vec3(1.)*.4*smoothstep(.15,.0,length(n.xy-vec2(-.35,.45)));}
  else{c=base*(.45+.65*dif);c+=.04*noise(gl_FragCoord.xy*.8);}}
 return c;}`,

blueprint: `
vec3 gen(){vec2 p=uv0();vec2 fc=gl_FragCoord.xy;vec3 c=uPal[0];
 vec2 g=p*20.;vec2 gd=abs(fract(g)-.5);float minor=1.-smoothstep(.45,.5,max(gd.x,gd.y))*0.;
 c=mix(c,uPal[2],stroke(min(.5-gd.x,.5-gd.y)/20.,.0006)*.5);
 vec2 G=p*4.;vec2 Gd=.5-abs(fract(G)-.5);c=mix(c,uPal[2],stroke(min(Gd.x,Gd.y)/4.,.0012)*.8);
 for(int i=0;i<6;i++){float fi=float(i);vec2 o=(vec2(h11(fi*3.+uSeed.x*7.),h11(fi*5.+uSeed.y*7.))-.5)*vec2(1.2,.7);
  float r=.06+.2*h11(fi*7.+uSeed.z);float prog=clamp(uPhase*3.-fi*.3,0.,1.)*0.+1.;
  c=mix(c,uPal[4],stroke(length(p-o)-r,.0018)*.9);
  c=mix(c,uPal[3],stroke(length(p-o)-r*.6,.0012)*.6*step(.5,h11(fi)));
  c=mix(c,uPal[4],fill(length(p-o)-.006));
  vec2 o2=(vec2(h11(fi*11.+uSeed.w*7.),h11(fi*13.+uSeed.x*3.))-.5)*vec2(1.2,.7);
  c=mix(c,uPal[4],stroke(sdSeg(p,o,o2),.0015)*.8);
  c=mix(c,uPal[3],stroke(sdSeg(p,o+vec2(0.,-r-.03),o+vec2(r,-r-.03)),.001)*.8);}
 vec2 tb=p-vec2(.35,-.3);c=mix(c,uPal[4],stroke(sdBox(tb,vec2(.15,.06),0.),.0015));
 c=mix(c,uPal[3],fill(sdBox(tb-vec2(-.03,.02),vec2(.09,.006),0.))*.7);
 c=mix(c,uPal[3],fill(sdBox(tb-vec2(-.05,-.02),vec2(.07,.004),0.))*.6);
 c+=.03*noise(fc*.3);
 return c;}`,

clouds: `
vec3 gen(){vec2 p=uv0();vec3 c=mix(uPal[3],uPal[4],clamp(p.y+.5,0.,1.));
 for(int i=0;i<3;i++){float fi=float(i);vec2 q=p*(1.5+fi)+vec2(uPhase*2.*(fi+1.),fi*3.)+uSeed.xy*9.;
  float n=fbm(q);float m=smoothstep(.5-fi*.03,.75,n);vec3 cc=mix(uPal[2],vec3(1.),n);
  c=mix(c,cc,m*(.7+.1*fi));}
 vec2 sp=vec2(.4*(uSeed.z-.5),.2);c+=uPal[1]*.25*exp(-length(p-sp)*3.);
 return c;}`,
};
