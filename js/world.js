// Procedural world composer: a 2.5D parallax scene built from ~15 independent seeded choices
// (sky/time, celestial body, clouds, terrain, water, structures, flora, creatures, character, weather, light, camera).
// Every x-function is periodic over PER so video loops are seamless while the camera travels.

export const WORLD_GLSL = `
uniform vec4 uW0; // time(0 night,1 golden,2 day,3 alien), celestial(0 none,1 sun,2 moon,3 ringed planet,4 twin suns,5 gas giant), clouds(0 none,1 cumulus,2 streaks,3 aurora), stars
uniform vec4 uW1; // terrain(0 peaks,1 dunes,2 mesas,3 floating isles,4 hills,5 spires), water, layers, roughness
uniform vec4 uW2; // structure(0 none,1 city,2 spires,3 ruins,4 pyramids,5 torii,6 lighthouse,7 turbines,8 megaring), cells, density, scale
uniform vec4 uW3; // flora(0 none,1 pines,2 round,3 palms,4 glow mushrooms,5 crystals,6 grass), density, creature(0 none,1 birds,2 sky whale,3 jellyfish,4 airships,5 fireflies), character(0 none,1 wanderer,2 robot,3 astronaut,4 duo,5 deer)
uniform vec4 uW4; // weather(0 clear,1 rain,2 snow,3 mist,4 dust,5 embers,6 petals), godrays, camera speed(0/1/2), haze
#define PER 6.
float NL,SI,LIT;vec2 SUN;vec3 SKYH,SKYT,SUNC;
float pn(float x,float f,float s){float a=x*TAU/PER;float r=f*PER/TAU;return fbm3(vec2(cos(a),sin(a))*r+vec2(s,s*.7));}
float camX(float d){return uSeed.y*PER+uPhase*PER*uW4.z*floor(1.+d*3.);}
float lxOf(float x,float d){return x*mix(1.5,.85,d)+camX(d);}
float ground(float x,float d,float id){float t=uW1.x;float s=id*7.3+uSeed.z*40.;
 float base=mix(.05,-.3,d);float amp=mix(.2,.12,d)*(.6+.8*uW1.w);
 if(t<.5){float n=pn(x,mix(1.,2.4,d),s);return base+amp*(pow(1.-abs(n*2.-1.),1.3)*1.5-.4);}
 if(t<1.5){float n=pn(x,mix(.6,1.3,d),s);return base+amp*.9*(n-.45);}
 if(t<2.5){float n=pn(x,mix(.8,1.6,d),s);return base-amp*.3+amp*1.1*smoothstep(.5,.54,n)+amp*.15*(n-.5);}
 if(t<3.5){float n=pn(x,mix(.8,1.6,d),s);return base-.22+amp*.4*(n-.5);}
 if(t<4.5){float n=pn(x,mix(1.,2.,d),s);return base+amp*1.2*(n-.5);}
 float k=d<.5?4.:8.;float c=mod(floor(x*k),PER*k);float f=fract(x*k);float hh=h11(c+s);
 return base-amp*.3+amp*(.3+1.7*hh*hh)*(1.-abs(f*2.-1.));}
float solid(float x,float y,float d,float id,out float top){
 float e=pxs()*1.5;
 if(uW1.x>2.5&&uW1.x<3.5&&d>.15){float s=id*7.3+uSeed.z*40.;float nc=6.+floor(d*4.);float cw=PER/nc;
  float ci=floor(x/cw);float c=mod(ci,nc);float cx=(ci+.5)*cw;top=-9.;
  if(h11(c+s)<.3)return 0.;
  float yt=mix(.16,-.14,d)+(h11(c*3.+s)-.5)*.16+.012*sin(T+c);float w=cw*(.24+.18*h11(c*5.+s));float lx=(x-cx)/w;
  if(abs(lx)>1.)return 0.;top=yt+.006*noise(vec2(x*30.,s));
  float bot=yt-.18*(1.-lx*lx)*(.45+.55*noise(vec2(x*22.,s+3.)));
  return smoothstep(-e,e,top-y)*smoothstep(-e,e,y-bot);}
 top=ground(x,d,id);return smoothstep(-e,e,top-y);}
vec3 layerCol(float d){vec3 nearC=mix(uPal[0],uPal[1],.3)*(LIT>.6?.75:1.);return mix(mix(SKYH,uPal[1],.3+.2*uW4.w),nearC,pow(d,.75));}

vec3 structure(vec2 q,float H,float W,float hs,float t){vec3 r=vec3(0.);
 if(t<1.5){float m=step(abs(q.x),W)*step(q.y,H)*step(-.05,q.y);float m2=step(abs(q.x+W*.2),W*.5)*step(q.y,H*1.15)*step(-.05,q.y);
  float ant=step(abs(q.x-W*.3),.0016)*step(q.y,H*1.35)*step(-.05,q.y);r.x=max(max(m,m2),ant);
  vec2 g=vec2(q.x/(W/3.),q.y/.011);vec2 gi=floor(g);vec2 gf=fract(g);
  r.y=max(m,m2)*step(.5,h21(gi+hs*17.))*step(.3,gf.x)*step(gf.x,.7)*step(.35,gf.y)*step(gf.y,.75)*step(.01,q.y)*step(q.y,H-.008);
  r.y=max(r.y,step(length(q-vec2(W*.3,H*1.35)),.004)*(.5+.5*sin(T*4.+hs*9.)));
  r.z=step(.8,fract(hs*3.))*step(abs(q.y-H*.6),.01)*step(abs(q.x),W*.8);}
 else if(t<2.5){float w=W*.55*(1.-q.y/(H*1.7));float m=step(abs(q.x),w)*step(q.y,H*1.7)*step(-.05,q.y);
  float ring=step(abs(q.y-H*(.5+.3*fract(hs*5.))),.004)*step(abs(q.x),w+.014);r.x=max(m,ring);
  r.y=ring*.9+m*step(.9,fract(q.y*45.))*.5+step(length(q-vec2(0.,H*1.7)),.006)*(.5+.5*sin(T*3.+hs*5.));}
 else if(t<3.5){float k=fract(hs*7.);
  if(k<.4){float m=step(abs(q.x),W)*step(q.y,H)*step(-.05,q.y);float hole=max(step(length(vec2(q.x,(q.y-H*.5)*.9)),W*.62),step(abs(q.x),W*.62)*step(q.y,H*.5));r.x=m*(1.-hole);}
  else if(k<.75){float hh=H*(.4+.6*fract(hs*13.));r.x=step(abs(q.x),W*.22)*step(q.y,hh-.012*abs(sin(q.x*400.)))*step(-.05,q.y);r.x=max(r.x,step(abs(q.x),W*.32)*step(abs(q.y-hh+.02),.008));}
  else{r.x=step(abs(q.x),W*.28)*step(q.y,H*1.5)*step(-.05,q.y);r.y=r.x*step(abs(q.x),.0025)*step(.25*H,q.y)*step(q.y,1.3*H)*.8;}}
 else if(t<4.5){r.x=step(abs(q.x)*1.1,H*1.1-q.y)*step(-.05,q.y);r.z=r.x*step(q.x,0.)*.35;r.y=step(length(q-vec2(0.,H*1.1)),.005)*LIT;}
 else if(t<5.5){float xn=q.x/W;float post=step(abs(abs(q.x)-W*.6),W*.08)*step(q.y,H*.85)*step(-.05,q.y);
  float b1=step(abs(q.y-H*.85-.03*H*xn*xn),H*.06)*step(abs(q.x),W*(1.+.0));float b2=step(abs(q.y-H*.66),H*.035)*step(abs(q.x),W*.72);
  r.x=max(post,max(b1,b2));r.z=r.x;}
 else if(t<6.5){float w=W*.32*(1.-q.y/(H*3.));float tw=step(abs(q.x),w)*step(q.y,H*1.9)*step(-.05,q.y);
  float lamp=step(length(q-vec2(0.,H*1.98)),W*.2);r.x=max(tw,lamp);r.z=tw*step(.5,fract(q.y/H*3.));
  r.y=lamp+exp(-length(q-vec2(0.,H*1.98))*40.)*.8*(.6+.4*sin(T*2.));}
 else{float tw=step(abs(q.x),.0025+.002*(1.-q.y/H))*step(q.y,H*1.4)*step(-.05,q.y);vec2 hub=vec2(0.,H*1.4);float bl=0.;
  for(int b=0;b<3;b++){float a=T*float(1+int(hs*2.))+float(b)*TAU/3.+hs*6.;bl=max(bl,step(sdSeg(q,hub,hub+vec2(cos(a),sin(a))*H*.75),.0025));}
  r.x=max(tw,bl);r.y=step(length(q-hub),.004)*.6;}
 return r;}

float tree(vec2 q,float s,float t,float hs,out float glow){glow=0.;
 if(t<1.5){float m=0.;for(int k=0;k<3;k++){float fk=float(k);float y0=s*(.15+fk*.26);float hh=s*.45;float w=s*.3*(1.-fk*.22);
   float yy=q.y-y0;m=max(m,step(0.,yy)*step(yy,hh)*step(abs(q.x+.01*s*sin(T+hs*6.)*yy/hh),w*(1.-yy/hh)));}
  return max(m,step(abs(q.x),s*.035)*step(q.y,s*.2)*step(-.05,q.y));}
 if(t<2.5){vec2 o=vec2(.015*s*sin(T+hs*6.),0.);float m=step(length((q-o-vec2(0.,s*.68))*vec2(1.,1.1)),s*.3)+step(length(q-o-vec2(s*.17,s*.5)),s*.2)+step(length(q-o-vec2(-s*.17,s*.48)),s*.19);
  m+=step(abs(q.x),s*.035)*step(q.y,s*.5)*step(-.05,q.y);return min(m,1.);}
 if(t<3.5){float bend=s*.35*(hs-.5);float tx=bend*pow(clamp(q.y/s,0.,1.),2.);float trunk=step(abs(q.x-tx),s*.028)*step(q.y,s)*step(-.05,q.y);
  vec2 top=vec2(bend,s);float fr=0.;
  for(int k=0;k<6;k++){float a=.25+float(k)*.53+.08*sin(T+hs*6.+float(k));vec2 dir=vec2(cos(a),sin(a)*.6);vec2 qq=q-top;
   float tt=clamp(dot(qq,dir)/(s*.5),0.,1.);vec2 pt=dir*tt*s*.5-vec2(0.,tt*tt*s*.18);fr=max(fr,step(length(qq-pt),s*.035*(1.-tt*.6)));}
  return max(trunk,fr);}
 if(t<4.5){float stem=step(abs(q.x+.02*s*sin(q.y/s*3.)),s*.05)*step(q.y,s*.6)*step(-.05,q.y);vec2 cq=q-vec2(0.,s*.6);
  float cap=step(length(cq*vec2(1.,1.9)),s*.34)*step(-.01*s,cq.y);glow=exp(-length(cq)/(s*.35))*.7*(.7+.3*sin(T*2.+hs*9.));
  return max(stem,cap);}
 if(t<5.5){vec2 cq=rot((hs-.5)*.7)*q;float m=step(abs(cq.x)/(s*.14)+abs(cq.y-s*.5)/(s*.55),1.);
  vec2 cq2=rot((hs-.5)*.7+.5)*(q-vec2(s*.12,0.));m=max(m,step(abs(cq2.x)/(s*.08)+abs(cq2.y-s*.3)/(s*.32),1.));
  glow=m*.35+exp(-length(q-vec2(0.,s*.45))/(s*.35))*.45;return m;}
 float m=0.;for(int k=0;k<5;k++){float fk=float(k);float bx=(fk-2.)*s*.06;float hh=s*(.22+.22*h11(hs*9.+fk));float tt=clamp(q.y/hh,0.,1.);
  m=max(m,step(abs(q.x-bx-tt*tt*s*.06*sin(T+fk+hs*5.)),s*.012*(1.-tt)+.0008)*step(q.y,hh)*step(-.05,q.y));}
 return m;}

vec3 chara(vec2 q,float s,float t){vec3 r=vec3(0.);float wk=uW4.z>.5?1.:0.;
 if(t<1.5||t>3.5&&t<4.5){
  r.x=step(length(q-vec2(0.,s*.86)),s*.065);
  float hat=step(abs(q.x),s*.07*(1.-(q.y-s*.9)/(s*.16)))*step(s*.88,q.y)*step(q.y,s*1.06);r.x=max(r.x,hat);
  float yy=(s*.8-q.y)/(s*.56);float fl=-sin(T*3.+q.y/s*14.)*s*.03*clamp(yy,0.,1.)-s*.04*clamp(yy,0.,1.);
  float cape=step(0.,yy)*step(yy,1.)*step(abs(q.x-fl),mix(s*.06,s*.17,clamp(yy,0.,1.)));r.x=max(r.x,cape);
  for(int k=0;k<2;k++){float fk=float(k);vec2 hip=vec2((fk-.5)*s*.06,s*.28);vec2 ft=vec2((fk-.5)*s*.06+wk*sin(T*8.+fk*PI)*s*.07,max(0.,wk*sin(T*8.+fk*PI+1.6))*s*.03);
   r.x=max(r.x,step(sdSeg(q,hip,ft),s*.026));}
  float st=step(sdSeg(q,vec2(s*.16,0.),vec2(s*.19,s*1.05)),s*.011);r.x=max(r.x,st);
  r.y=exp(-length(q-vec2(s*.19,s*1.08))/(s*.05))*LIT;
  float sx=-q.x/(s*.45);float sy=s*.79+sin(q.x/s*10.+T*3.)*s*.03;float scarf=step(0.,sx)*step(sx,1.)*step(abs(q.y-sy),s*.022*(1.-sx*.6));r.z=scarf;r.x=max(r.x,scarf);}
 else if(t<2.5){float hd=sdBox(q-vec2(0.,s*.8),vec2(s*.12,s*.09),s*.025);float bd=sdBox(q-vec2(0.,s*.47),vec2(s*.13,s*.17),s*.03);
  float lg=min(sdBox(q-vec2(-s*.06,s*.14+wk*sin(T*8.)*s*.02),vec2(s*.03,s*.14),s*.01),sdBox(q-vec2(s*.06,s*.14-wk*sin(T*8.)*s*.02),vec2(s*.03,s*.14),s*.01));
  float ar=sdSeg(q,vec2(s*.15,s*.6),vec2(s*.24,s*.38+s*.03*sin(T*2.)))-s*.025;float an=sdSeg(q,vec2(s*.06,s*.88),vec2(s*.1,s*1.02))-s*.008;
  r.x=step(min(min(min(hd,bd),min(lg,ar)),an),0.);
  float eye=step(sdBox(q-vec2(s*.0,s*.81),vec2(s*.085,s*.022),s*.02),0.);r.y=max(eye*(.8+.2*sin(T*6.)),step(length(q-vec2(s*.1,s*1.03)),s*.025)*(.5+.5*sin(T*4.)));
  r.z=step(length(q-vec2(0.,s*.5)),s*.05);}
 else if(t<3.5){float hel=length(q-vec2(0.,s*.8))-s*.13;float bd=sdBox(q-vec2(0.,s*.45),vec2(s*.13,s*.17),s*.07);float pk=sdBox(q-vec2(-s*.15,s*.5),vec2(s*.05,s*.13),s*.02);
  float lg=min(sdBox(q-vec2(-s*.06,s*.13+wk*sin(T*8.)*s*.02),vec2(s*.045,s*.14),s*.03),sdBox(q-vec2(s*.06,s*.13-wk*sin(T*8.)*s*.02),vec2(s*.045,s*.14),s*.03));
  r.x=step(min(min(hel,bd),min(pk,lg)),0.);
  vec2 vq=q-vec2(s*.03,s*.81);float vis=step(length(vq*vec2(1.,1.4)),s*.085);r.y=vis*(.35+.65*smoothstep(-s*.08,s*.08,vq.y+vq.x));r.z=vis;
  r.y=max(r.y,step(length(q-vec2(s*.05,s*.5)),s*.02)*(.5+.5*sin(T*5.)));}
 else{vec2 b=q-vec2(0.,s*.55);float body=step(length(b/vec2(s*.28,s*.12)),1.);float nk=step(sdSeg(q,vec2(s*.2,s*.6),vec2(s*.3,s*.85)),s*.05);
  float hd=step(length((q-vec2(s*.34,s*.86))/vec2(s*.09,s*.055)),1.);float lg=0.;
  for(int k=0;k<4;k++){float fk=float(k);float lx=(fk<2.?-.18:.16)+mod(fk,2.)*.05;float sw=wk*sin(T*8.+fk*1.6)*s*.05;lg=max(lg,step(sdSeg(q,vec2(lx*s,s*.5),vec2(lx*s+sw,0.)),s*.022));}
  float an=0.;for(int k=0;k<2;k++){float sg=float(k)*2.-1.;vec2 a0=vec2(s*.31,s*.92);vec2 a1=a0+vec2(-s*.05+sg*s*.04,s*.17);an=max(an,step(sdSeg(q,a0,a1),s*.012));
   an=max(an,step(sdSeg(q,a0+(a1-a0)*.5,a0+(a1-a0)*.5+vec2(sg*s*.07,s*.06)),s*.01));an=max(an,step(sdSeg(q,a1,a1+vec2(-s*.06,s*.05)),s*.01));}
  r.x=max(max(max(body,nk),max(hd,lg)),an);r.y=step(length(q-vec2(s*.37,s*.875)),s*.012)*LIT;}
 return r;}

vec3 sky(vec2 p){float y=clamp(p.y*1.3+.35,0.,1.);vec3 c=mix(SKYH,SKYT,pow(y,.8));
 vec2 g=floor(gl_FragCoord.xy/max(1.,uRes.y/600.));float st=h21(g+uSeed.zw*40.);
 c+=step(1.-.004*uW0.w,st)*(.5+.5*sin(T*2.+st*50.))*smoothstep(-.1,.3,p.y)*LIT;
 float cel=uW0.y;vec2 d=p-SUN;
 if(cel>.5&&cel<1.5){c+=SUNC*exp(-length(d)*4.)*.6;c=mix(c,mix(SUNC,vec3(1.),.6),fill(length(d)-.075));}
 else if(cel<2.5){c+=uPal[4]*exp(-length(d)*6.)*.25;float m=fill(length(d)-.06);float cr=.85+.15*noise(d*60.+uSeed.xy*9.);
  float sh=fill(length(d-vec2(.025,.01))-.058)*.85*step(.5,uSeed.w);c=mix(c,uPal[4]*cr*(1.-sh)+SKYT*sh,m);}
 else if(cel<3.5){vec2 q=rot(-.35+uSeed.x*.4)*d;float r=.11;float pl=fill(length(q)-r);vec3 pc=mix(uPal[2],uPal[4],smoothstep(-r,r,q.x+q.y))*(.6+.4*sin(q.y*70.+noise(q*20.)*3.));
  float ring=stroke(length(q*vec2(1.,3.2))-r*1.75,r*.18)*(.6+.4*step(.5,fract(length(q*vec2(1.,3.2))*60.)));float front=step(q.y,0.);
  c=mix(c,uPal[3]*.9,ring*(1.-front)*.8);c=mix(c,pc,pl);c=mix(c,uPal[3],ring*front*.9);c+=uPal[2]*exp(-length(q)*5.)*.2;}
 else if(cel<4.5){vec2 d2=d-vec2(.18,.08);c+=SUNC*exp(-length(d)*4.)*.5+uPal[2]*exp(-length(d2)*5.)*.4;
  c=mix(c,vec3(1.,.97,.9),fill(length(d)-.06));c=mix(c,mix(uPal[2],vec3(1.),.5),fill(length(d2)-.035));}
 else if(cel<5.5){vec2 gc=vec2(SUN.x,.62);float R=.42;vec2 q=p-gc;float m=fill(length(q)-R);
  float bands=sin(q.y*38.+fbm3(q*6.+uSeed.xy*9.)*4.)*.5+.5;vec3 pc=mix(uPal[2],uPal[3],bands)*(.35+.65*smoothstep(R,-R,q.x*.6-q.y));
  c+=uPal[3]*exp(-abs(length(q)-R)*18.)*.25;c=mix(c,pc,m);}
 float ct=uW0.z;
 if(ct>.5&&ct<1.5){float n=fbm(vec2(p.x*1.4,p.y*3.2)+L*.25+uSeed.xy*9.);float m=smoothstep(.52,.78,n)*smoothstep(-.12,.25,p.y);
  vec3 cc=mix(mix(SKYH,uPal[4],.5),SUNC,.35*smoothstep(.8,.0,length(p-SUN)))*(.85+.25*n);c=mix(c,cc,m*.92);}
 else if(ct<2.5){float n=fbm(vec2(p.x*1.2+L.x*.15,p.y*22.)+uSeed.zw*9.);float m=smoothstep(.55,.72,n)*smoothstep(-.05,.3,p.y);
  c=mix(c,mix(uPal[3],uPal[4],smoothstep(.5,.0,length(p-SUN))),m*.85);}
 else if(ct<3.5){float r=fbm(vec2(p.x*1.3+L.x*.3,p.y+L.y*.2)+uSeed.xy*9.);float band=smoothstep(.2,0.,abs(p.y-.22-(r-.5)*.5));
  c+=mix(uPal[2],uPal[4],r)*band*.55*(.5+.5*sin(p.x*30.+r*12.+T));}
 if(uW2.x>7.5){vec2 q=rot(.28)*(p-vec2(SUN.x*.3,.05));float e=length(q*vec2(1.,4.5))-.95;float rg=stroke(e,.025);float back=step(0.,q.y);
  vec3 rc=mix(uPal[1],uPal[4],.3+.4*smoothstep(-1.,1.,q.x))*(.75+.25*step(.5,fract(q.x*40.)));c=mix(c,rc,rg*(.55+.45*back));
  c+=uPal[4]*.6*step(abs(e),.003)*step(.98,fract(q.x*12.+uPhase*2.));}
 if(uW4.y>.5&&uW0.y>.5&&uW0.y<4.5){float a=atan(d.y,d.x);float ray=pow(noise(vec2(a*9.,uSeed.x*20.)+vec2(0.,T*0.)),3.)*smoothstep(1.4,.0,length(d));c+=SUNC*ray*.25;}
 return c;}

vec3 creatures(vec2 p,vec3 c){float t=uW3.z;
 if(t>.5&&t<1.5){for(int k=0;k<9;k++){float fk=float(k);vec2 o=vec2(fract(h11(fk+uSeed.x*9.)+uPhase*(1.+floor(h11(fk*3.)*2.)))*3.4-1.7,.12+.25*h11(fk*7.+uSeed.y)+.015*sin(T*2.+fk));
   float s=.01+.014*h11(fk*5.);vec2 q=p-o;float fl=sin(T*12.+fk*2.)*s*.6;
   float b=min(sdSeg(q,vec2(0.),vec2(-s,fl)),sdSeg(q,vec2(0.),vec2(s,fl)));c=mix(c,mix(uPal[0],SKYH,.25),fill(b-s*.14));}}
 else if(t<2.5){vec2 o=vec2(fract(uSeed.w+uPhase)*3.6-1.8,.2+.06*sin(T)+.1*uSeed.z);vec2 q=(p-o)*rot(.05*sin(T));
  float body=length(q/vec2(.26,.075+.02*smoothstep(.0,.2,q.x)));float tail=length((q-vec2(-.31,.02*sin(T*2.)))*rot(.6)/vec2(.06,.018));float tail2=length((q-vec2(-.31,-.0+.02*sin(T*2.)))*rot(-.6)/vec2(.06,.018));
  float fin=length((q-vec2(.04,-.06))*rot(-.5)/vec2(.06,.015));float m=fill(min(min(body,fin),min(tail,tail2))-1.);
  vec3 wc=mix(mix(SKYH,uPal[1],.6),uPal[0],.25)*(.8+.3*smoothstep(-.07,.07,q.y));wc=mix(wc,wc*1.3,step(q.y,-.02)*step(.5,fract(q.x*40.)));
  c=mix(c,wc,m*.92);c+=uPal[4]*m*step(.92,h21(floor(q*90.)))*.8*LIT;c=mix(c,uPal[4],fill(length(q-vec2(.17,.01))-.006)*m);}
 else if(t<3.5){for(int k=0;k<5;k++){float fk=float(k);vec2 o=vec2(fract(h11(fk*3.+uSeed.x)+uPhase)*3.-1.5,-.05+.35*h11(fk*7.+uSeed.y)+.03*sin(T+fk*2.));
   float s=.03+.04*h11(fk*11.);vec2 q=(p-o)/s;float dome=fill((length(q*vec2(1.,1.4))-1.)*s)*step(-.1,q.y);float ten=0.;
   for(int j=0;j<4;j++){float fj=float(j);float tx=(fj-1.5)*.45+.15*sin(q.y*3.+T*2.+fj);ten=max(ten,step(abs(q.x-tx),.06)*step(q.y,0.)*step(-2.4,q.y));}
   vec3 jc=mix(uPal[2],uPal[4],.4);c+=jc*exp(-length(q*vec2(1.,1.4))*1.2)*.3;c=mix(c,jc,dome*.75+ten*.5);}}
 else if(t<4.5){for(int k=0;k<3;k++){float fk=float(k);vec2 o=vec2(fract(h11(fk*3.+uSeed.x)+uPhase*(fk<1.?1.:2.))*3.2-1.6,.12+.25*h11(fk*7.+uSeed.y)+.01*sin(T+fk));
   float s=.03+.04*h11(fk*13.);vec2 q=(p-o)/s;float bal=length(q/vec2(1.,.45))-1.;float gon=sdBox(q-vec2(0.,-.75),vec2(.3,.12),.05);float rope=min(sdSeg(q,vec2(-.4,-.3),vec2(-.25,-.65)),sdSeg(q,vec2(.4,-.3),vec2(.25,-.65)))-.03;
   float m=fill(min(min(bal,gon),rope)*s);vec3 sc=mix(uPal[0],SKYH,.35);c=mix(c,sc,m);c=mix(c,uPal[3],fill(abs(q.y)*s-.006)*step(bal,0.)*.6);
   c+=uPal[4]*exp(-length(q-vec2(0.,-.75))*3.)*.5*LIT;}}
 else if(t<5.5){for(int k=0;k<30;k++){float fk=float(k);vec2 o=vec2((h11(fk*3.+uSeed.x)-.5)*2.+.05*sin(T+fk),-.35+.35*h11(fk*7.+uSeed.y)+.03*sin(T*2.+fk*3.));
   c+=mix(uPal[3],uPal[4],.5)*exp(-length(p-o)*160.)*1.2*(.4+.6*sin(T*3.+fk*5.)*.5+.3);}}
 return c;}

vec3 drawLayer(vec2 p,float fi,vec3 c){
 float d=NL>1.?fi/(NL-1.):1.;float lx=lxOf(p.x,d);float top;float m=solid(lx,p.y,d,fi,top);vec3 lc=layerCol(d);
 vec3 col=lc*(1.-.3*clamp((top-p.y)*2.5,0.,1.));col+=SUNC*.3*smoothstep(.01,0.,top-p.y)*(1.-d*.5);
 if(uW1.x>2.5&&uW1.x<3.5&&d>.15&&top>-1.)col=mix(col,mix(uPal[2],uPal[3],.4)*(1.-d*.5),smoothstep(.012,.0,top-p.y)*.8);
 c=mix(c,col,m);
 if(uW1.x>2.5&&uW1.x<3.5&&d>.15&&top>-1.){float wf=step(.6,h11(floor(lx*7.)+fi))*step(abs(fract(lx*7.)-.5),.04)*step(p.y,top-.05);c=mix(c,mix(uPal[4],SKYH,.5),wf*.5*(.8+.2*sin(p.y*200.+T*8.)));}
 if(fi==SI&&uW2.x>.5){float nc=uW2.y;float cw=PER/nc;
  for(int j=-1;j<=1;j++){float ci=floor(lx/cw)+float(j);float cid=mod(ci,nc);float hs=h11(cid*1.7+uSeed.w*30.);
   if(hs>uW2.z)continue;float cx=(ci+.5)*cw;float gt;solid(cx,0.,d,fi,gt);if(gt<-1.)continue;
   float st=uW2.x>7.5?2.:uW2.x;float H=(.05+.14*fract(hs*7.3))*uW2.w;float W=cw*(.12+.2*fract(hs*3.1));
   if(st>5.5&&st<6.5){H*=.8;W=cw*.12;}
   vec3 s=structure(vec2(lx-cx,p.y-gt),H,W,hs,st);
   c=mix(c,lc*.8,s.x);c=mix(c,uPal[3]*(.6+.4*(1.-d)),s.z*s.x*.85);c=mix(c,mix(uPal[4],uPal[3],.25),s.y*(.25+.75*LIT));
   c+=uPal[4]*s.y*.25*LIT;}}
 if(uW3.x>.5&&fi>=NL-2.){float nc=floor(18.+uW3.y*30.)*(fi>=NL-1.?1.:1.5);nc=floor(nc);float cw=PER/nc;
  for(int j=-1;j<=1;j++){float ci=floor(lx/cw)+float(j);float cid=mod(ci,nc);float hs=h11(cid*2.3+fi*5.+uSeed.x*20.);
   if(hs>uW3.y)continue;float cx=(ci+.5)*cw+(fract(hs*9.)-.5)*cw*.6;float gt;solid(cx,0.,d,fi,gt);if(gt<-1.)continue;
   float sz=(.05+.07*fract(hs*5.7))*(fi>=NL-1.?1.:.65);float gl;float tm=tree(vec2(lx-cx,p.y-gt+.004),sz,uW3.x,hs,gl);
   c=mix(c,lc*.85,tm);c+=mix(uPal[2],uPal[4],.5)*gl*(.35+.65*LIT)*.8;}}
 return c;}

vec3 world(vec2 p,float upto){vec3 c=sky(p);
 for(int i=0;i<6;i++){float fi=float(i);if(fi>=upto)break;
  if(uW3.z>1.5&&uW3.z<3.5&&fi==1.)c=creatures(p,c);
  c=drawLayer(p,fi,c);
  if(fi<NL-1.){float d=fi/(NL-1.);c=mix(c,SKYH,uW4.w*.18*(1.-d));}}
 return c;}

vec3 gen(){vec2 p=uv0();
 float tm=uW0.x;LIT=tm<.5?1.:(tm<1.5?.6:(tm<2.5?.12:.9));
 if(tm<.5){SKYT=uPal[0];SKYH=mix(uPal[1],uPal[2],.35);SUNC=uPal[4];}
 else if(tm<1.5){SKYT=mix(uPal[1],uPal[2],.3);SKYH=uPal[3];SUNC=uPal[4];}
 else if(tm<2.5){SKYT=mix(uPal[2],uPal[4],.15);SKYH=mix(uPal[4],uPal[3],.35);SUNC=vec3(1.,.97,.9);}
 else{SKYT=uPal[0];SKYH=mix(uPal[2],uPal[1],.4);SUNC=uPal[4];}
 SUN=vec2((uSeed.x-.5)*.9,tm<1.5&&tm>.5?.04+.1*uSeed.w:.18+.14*uSeed.w);
 NL=uW1.z;SI=floor(NL*.5);
 float wl=-.2-.06*uSeed.z;vec3 c;
 if(uW1.y>.5&&p.y<wl){vec2 q=vec2(p.x+.008*sin(p.y*140.+T*2.)*(wl-p.y)*6.,2.*wl-p.y);
  c=world(q,NL-1.);vec3 wc=mix(SKYT,uPal[0],.55);c=mix(c*.75,wc,clamp(.25+(wl-p.y)*1.6,0.,.85));
  c+=SUNC*.6*step(.75,noise(vec2(p.x*60.,p.y*300.+T*2.)))*exp(-abs(p.x-SUN.x)*(5.+40.*(wl-p.y)))*smoothstep(-.6,wl,p.y);
  c=mix(c,SKYH,smoothstep(.006,0.,wl-p.y)*.5);
  c=drawLayer(p,NL-1.,c);}
 else c=world(p,NL);
 if(uW3.z<1.5||uW3.z>3.5)c=creatures(p,c);
 if(uW3.w>.5){float cx=(uSeed.w-.5)*.7;float dN=1.;float gt;solid(lxOf(cx,dN),0.,dN,NL-1.,gt);
  float plat=0.;if(gt<-1.){gt=-.17+.012*sin(T);plat=1.;}
  {float s=.2+.12*fract(uSeed.z*7.);
   if(plat>.5){vec2 pq=p-vec2(cx,gt);float rock=fill(max(pq.y,length(pq/vec2(s*.55,s*.3))-1.)*1.)+fill(sdBox(pq-vec2(0.,-.003),vec2(s*.55,.004),.004));
    c=mix(c,layerCol(1.)*.75,rock);c=mix(c,mix(uPal[2],uPal[3],.4),fill(sdBox(pq-vec2(0.,-.002),vec2(s*.55,.003),.003))*.8);}vec3 ch=chara(p-vec2(cx,gt-.004),s,uW3.w);vec3 sc=layerCol(1.)*.7;
   c=mix(c,sc,ch.x);c=mix(c,uPal[3],ch.z*ch.x*.9);c=mix(c,uPal[4],ch.y);c+=uPal[4]*ch.y*.3;
   if(uW3.w>3.5&&uW3.w<4.5){vec3 c2=chara(p-vec2(cx+s*.45,gt-.004),s*.6,2.);c=mix(c,sc,c2.x);c=mix(c,uPal[4],c2.y);}}}
 float wt=uW4.x;
 if(wt>.5&&wt<1.5){vec2 g=gl_FragCoord.xy/uRes.y;g.x+=g.y*.18;float col=floor(g.x*140.);float y=fract(g.y*1.3+uPhase*6.+h11(col*3.7));
  c=mix(c,mix(SKYH,vec3(.9),.5),step(y,.05)*step(.55,h11(col))*.35);c=mix(c,SKYT*.6,.12);}
 else if(wt>1.5&&wt<2.5||wt>4.5){for(int l=0;l<3;l++){float fl=float(l);float sc=10.+fl*9.;float M=floor(sc)+2.;vec2 g=p*sc;
   g.y+=uPhase*M*(wt>4.5&&wt<5.5?-1.:1.)*(1.+fl*0.)+0.;g.x+=sin(T+g.y*.5+fl)*.4;vec2 id=floor(g);id.y=mod(id.y,M);vec2 f=fract(g)-.5-(h22(id+fl*7.)-.5)*.6;
   float pr=step(.55,h21(id+fl*3.+uSeed.x*5.));
   if(wt<2.5)c=mix(c,vec3(.97),pr*smoothstep(.09,.03,length(f))*(.5+fl*.2));
   else if(wt<5.5)c+=vec3(1.,.5,.15)*pr*smoothstep(.12,0.,length(f))*.8;
   else{vec2 ff=rot(T+id.x)*f;c=mix(c,mix(uPal[3],vec3(1.,.8,.85),.5),pr*smoothstep(.09,.05,length(ff*vec2(1.,2.2)))*.85);}}}
 else if(wt>2.5&&wt<3.5){float n=fbm(vec2(p.x*2.,p.y*6.)+L*.35+uSeed.xy*5.);c=mix(c,mix(SKYH,vec3(1.),.25),smoothstep(.0,-.45,p.y)*smoothstep(.35,.75,n)*.7);}
 else if(wt>3.5&&wt<4.5){c=mix(c,SUNC*.8+SKYH*.2,.15+.15*fbm(p*3.+L*.3));}
 return c;}
`;

// ---------------- configuration ----------------
const R = (a, b) => [a, b];
const ANY = {
  time: [0, 1, 2, 3], cel: [0, 1, 2, 3, 4, 5], cloud: [0, 1, 2, 3], terrain: [0, 1, 2, 3, 4, 5], water: [0, 0, 1],
  struct: [0, 1, 2, 3, 4, 5, 6, 7, 8], flora: [0, 1, 2, 3, 4, 5, 6], creature: [0, 1, 2, 3, 4, 5], char: [0, 1, 2, 3, 4, 5],
  weather: [0, 0, 1, 2, 3, 4, 5, 6], rays: [0, 1],
};
export const BIOMES = {
  dreamscape: { ...ANY, pals: ['dawnpeach', 'tealdusk', 'lofi', 'sakura', 'oceandusk', 'magalien', 'emerald', 'mars', 'arctic', 'desert', 'jungle', 'storm', 'dusk', 'vapor', 'synth', 'random'] },
  alien: { time: [3, 3, 0], cel: [3, 4, 5, 5], cloud: [0, 3, 2], terrain: [5, 0, 3, 2], water: [0, 1], struct: [0, 2, 8, 3], flora: [4, 5, 4], creature: [2, 3, 3, 5], char: [3, 2, 1, 0], weather: [0, 4, 5, 3], rays: [0, 1], pals: ['magalien', 'emerald', 'mars', 'alien', 'opal'] },
  solarpunk: { time: [2, 1, 2], cel: [1, 1, 0], cloud: [1, 1, 2], terrain: [4, 0, 3], water: [0, 1], struct: [7, 2, 7, 1], flora: [2, 2, 3, 6], creature: [1, 4, 4], char: [1, 4, 2, 0], weather: [0, 0, 6], rays: [1], pals: ['jungle', 'solar', 'citrus', 'tealdusk'] },
  cyberpunk: { time: [0, 0, 3], cel: [0, 2, 5], cloud: [0, 2], terrain: [4, 2], water: [0, 1], struct: [1, 1, 2], flora: [0, 6], creature: [0, 4, 3], char: [2, 1, 4], weather: [1, 1, 3, 0], rays: [0], pals: ['neon', 'synth', 'magalien', 'lofi', 'vapor'] },
  lofi: { time: [1, 0, 1], cel: [1, 2, 0], cloud: [2, 2, 1], terrain: [4, 0], water: [0, 1, 1], struct: [1, 6, 5], flora: [2, 6, 1], creature: [1, 0, 4], char: [4, 1, 5], weather: [0, 6, 2, 1], rays: [0, 1], pals: ['lofi', 'dawnpeach', 'sakura', 'oceandusk', 'dusk'] },
  desert: { time: [1, 2, 3], cel: [1, 4, 5], cloud: [0, 2], terrain: [1, 2, 1], water: [0], struct: [4, 3, 3, 0], flora: [0, 3, 5], creature: [0, 1, 2], char: [1, 1, 5, 4], weather: [4, 0, 4], rays: [1, 0], pals: ['desert', 'mars', 'dawnpeach', 'earth'] },
  isles: { time: [1, 2, 3, 0], cel: [1, 2, 3, 5], cloud: [1, 2, 1], terrain: [3], water: [0, 1], struct: [5, 3, 6, 0, 7], flora: [2, 1, 4, 5], creature: [2, 4, 1, 3], char: [1, 4, 2, 3], weather: [0, 6, 3], rays: [1], pals: ['tealdusk', 'sakura', 'dawnpeach', 'emerald', 'magalien', 'oceandusk'] },
  ocean: { time: [0, 1, 1, 2], cel: [2, 1, 3], cloud: [2, 1, 3], terrain: [4, 0], water: [1], struct: [6, 6, 0, 3], flora: [3, 0, 6], creature: [1, 2, 3], char: [0, 1, 4], weather: [0, 3, 1], rays: [1, 0], pals: ['oceandusk', 'tealdusk', 'arctic', 'dawnpeach', 'storm'] },
  frozen: { time: [0, 1, 2], cel: [2, 1, 3], cloud: [3, 3, 1], terrain: [0, 5], water: [0, 1], struct: [0, 5, 3], flora: [1, 1, 5], creature: [0, 1, 2], char: [5, 1, 3], weather: [2, 2, 0, 3], rays: [0, 1], pals: ['arctic', 'glacier', 'ice', 'storm'] },
  forest: { time: [0, 1, 2], cel: [2, 1, 0], cloud: [0, 1], terrain: [4, 0], water: [0, 1], struct: [0, 5, 3, 0], flora: [1, 2, 4], creature: [5, 5, 1], char: [5, 1, 4, 0], weather: [3, 3, 0, 6], rays: [1], pals: ['jungle', 'emerald', 'forest', 'tealdusk'] },
};

export function worldConfig(rng, biome = 'dreamscape') {
  const B = BIOMES[biome] || BIOMES.dreamscape, p = (k) => rng.pick(B[k]);
  const terrain = p('terrain');
  const W = [
    p('time'), p('cel'), p('cloud'), rng.float(0.5, 1),
    terrain, p('water'), rng.int(4, 6), rng.float(0.2, 1),
    p('struct'), rng.int(6, 14), rng.float(0.25, 0.7), rng.float(0.8, 1.6),
    p('flora'), rng.float(0.25, 0.75), p('creature'), p('char'),
    p('weather'), p('rays'), rng.pick([1, 1, 1, 2]), rng.float(0.2, 1),
  ];
  if (W[0] === 2 && W[1] === 2) W[1] = 1; // no moon in daylight
  return { W, pals: B.pals, desc: describe(W) };
}
const NAMES = {
  time: ['night', 'golden hour', 'day', 'alien sky'], cel: ['', 'sun', 'moon', 'ringed planet', 'twin suns', 'gas giant'],
  terrain: ['peaks', 'dunes', 'mesas', 'floating isles', 'hills', 'spires'],
  struct: ['', 'city', 'spires', 'ruins', 'pyramids', 'torii gates', 'lighthouse', 'wind turbines', 'megastructure'],
  flora: ['', 'pines', 'trees', 'palms', 'glow-shrooms', 'crystals', 'grass'], creature: ['', 'birds', 'sky whale', 'jellyfish', 'airships', 'fireflies'],
  char: ['', 'wanderer', 'robot', 'astronaut', 'two travelers', 'deer'], weather: ['', 'rain', 'snow', 'mist', 'dust', 'embers', 'petals'],
};
function describe(W) {
  return [NAMES.time[W[0]], NAMES.cel[W[1]], NAMES.terrain[W[4]], W[5] ? 'water' : '', NAMES.struct[W[8]], NAMES.flora[W[12]], NAMES.creature[W[14]], NAMES.char[W[15]], NAMES.weather[W[16]]].filter(Boolean).join(' · ');
}
