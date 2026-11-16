// 3D creatures: raymarched smooth-SDF characters in a lit diorama (soft shadows, AO, rim light),
// sharing the continuous parameter layout of creatures.js. Camera orbits gently in video.
export const CREATURE3D_GLSL = `
uniform vec4 uW0;uniform vec4 uW1;uniform vec4 uW2;uniform vec4 uW3;uniform vec4 uW4;
float h3l(vec3 p){p=fract(p*.1031);p+=dot(p,p.zyx+31.32);return fract((p.x+p.y)*p.z);}
float n3l(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(h3l(i),h3l(i+vec3(1.,0.,0.)),f.x),mix(h3l(i+vec3(0.,1.,0.)),h3l(i+vec3(1.,1.,0.)),f.x),f.y),mix(mix(h3l(i+vec3(0.,0.,1.)),h3l(i+vec3(1.,0.,1.)),f.x),mix(h3l(i+vec3(0.,1.,1.)),h3l(i+vec3(1.,1.,1.)),f.x),f.y),f.z);}
float BW,BH,HR,LH,HM,TOPR;vec3 HC,TOPC,FC;float FR;
float sE(vec3 p,vec3 r){float k0=length(p/r);float k1=length(p/(r*r));return k0*(k0-1.)/max(k1,1e-4);}
float sC(vec3 p,vec3 a,vec3 b,float ra,float rb){vec3 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h)-mix(ra,rb,h);}
float EYE;
vec2 map(vec3 p){float d=p.y;float m=0.;
 vec3 b=p-vec3(0.,LH+BH,0.);b.x*=1.+uW0.w*clamp(b.y/BH,-1.,1.)*.4;b.z*=1.+uW0.w*clamp(b.y/BH,-1.,1.)*.4;
 float body=sE(b,vec3(BW,BH,BW*.9));if(uW0.z<.6)body=mix(sE(b,vec3(BW,BH,BW*.9)),length(max(abs(b)-vec3(BW,BH,BW*.85)*.75,0.))-min(BW,BH)*.28,.6-uW0.z);
 if(HM>.5)body=smin(body,sE(p-HC,vec3(HR*1.05,HR,HR*.95)),.07);
 float et=uW1.z,el=uW1.w;float acc=1e3;
 if(et>.5){for(int k=0;k<2;k++){float s=float(k)*2.-1.;float a=s*(.42+.45*uW2.x)+.07*sin(T*2.+s);vec3 dir=vec3(sin(a),cos(a),-.05);vec3 base=TOPC+dir*TOPR*.78;
   if(et<1.5)body=smin(body,length(p-base-dir*TOPR*.18*el)-TOPR*.3,.04);
   else if(et<2.5)body=smin(body,sC(p,base-dir*TOPR*.15,base+dir*TOPR*.75*el,TOPR*.28,TOPR*.04),.04);
   else if(et<3.5){vec3 tip=base+dir*TOPR*.9*el;body=min(body,sC(p,base,tip,.009,.007));acc=min(acc,length(p-tip)-.03);}
   else if(et<4.5){vec3 tip=base+dir*TOPR*.55*el+vec3(s*TOPR*.25,TOPR*.1,TOPR*.1);acc=min(acc,sC(p,base-dir*TOPR*.1,tip,TOPR*.13,TOPR*.025));}
   else body=smin(body,sC(p,base-dir*TOPR*.1,base+dir*TOPR*1.35*el,TOPR*.16,TOPR*.12),.04);}}
 if(uW2.y>.15){for(int k=0;k<2;k++){float s=float(k)*2.-1.;vec3 sh=vec3(s*BW*.8,LH+BH*1.05,0.);float wv=(k==1&&uP.w>.5)?.6+.4*sin(T*2.):0.;
   vec3 dir=normalize(vec3(s*(1.-wv*.5),-1.+wv*2.3,.25));body=smin(body,sC(p,sh,sh+dir*.11*uW2.y,.04,.034),.035);}}
 if(LH>.005){for(int k=0;k<2;k++){float s=float(k)*2.-1.;body=smin(body,sC(p,vec3(s*BW*.42,LH+.03,0.),vec3(s*BW*.48,.03,.02),.045,.04),.03);body=smin(body,sE(p-vec3(s*BW*.5,.028,.03),vec3(.06,.03,.075)),.02);}}
 if(uW2.w>.5)body=smin(body,sC(p,vec3(0.,LH+BH*.5,-BW*.8),vec3(-BW*.3,LH+BH*1.1+.02*sin(T*2.),-BW*1.35),.03,.055),.04);
 if(uW4.y>2.5)body+=(n3l(p*80.)-.5)*.006;
 if(body<d){d=body;m=1.;}if(acc<d){d=acc;m=2.;}
 float ne=uW3.x,er=FR*.15*uW3.y,sp=FR*uW3.z;
 for(int k=0;k<3;k++){float fk=float(k);if(fk>=ne)break;vec3 c;float r=er;
  if(ne<1.5){c=FC+vec3(0.,FR*.05,0.);r=er*1.6;}else if(k<2)c=FC+vec3((fk*2.-1.)*sp,0.,0.);else{c=FC+vec3(0.,FR*.45,0.);r=er*.7;}
  c.z=FC.z-r*.35;float bl=step(fract(uPhase*2.+uP.z),.035);float e=sE(p-c,vec3(r,r*1.12*(1.-bl*.85),r*.7));if(e<d){d=e;m=3.;}}
 return vec2(d,m);}
vec3 gen(){vec2 p=uv0();
 BW=uW0.x;BH=uW0.y*(1.+.015*sin(T*2.));HM=uW1.x;HR=uW1.y;LH=uW2.z*.07;
 HC=vec3(0.,LH+BH*2.+HR*.55,0.);TOPC=HM>.5?HC:vec3(0.,LH+BH,0.);TOPR=HM>.5?HR:max(BW,BH);
 FR=HM>.5?HR:min(BW,BH)*.95;FC=HM>.5?HC+vec3(0.,-HR*.12,HR*.92):vec3(0.,LH+BH*1.22,BW*.84);
 float Ht=LH+2.*uW0.y+(HM>.5?HR*1.5:0.)+.15;
 float yaw=(uSeed.x-.5)*.8+.35*sin(T);float dist=1.65*Ht+.55;vec3 ta=vec3(0.,Ht*.48,0.);
 vec3 ro=ta+vec3(sin(yaw),.28+.1*uSeed.y,cos(yaw))*dist;vec3 fw=normalize(ta-ro);vec3 rt=normalize(cross(fw,vec3(0.,1.,0.)));vec3 up=cross(rt,fw);
 vec3 rd=normalize(fw*2.4+p.x*rt+p.y*up);
 vec3 L=normalize(vec3(-.6,.9,.7));
 float bgk=uW4.w;vec3 bg=bgk<1.5&&bgk>.5?mix(uPal[1],uPal[0],clamp(p.y+.6,0.,1.)):mix(uPal[4],uPal[3],clamp(.4-p.y,0.,1.)*.8);
 for(int i=0;i<6;i++){float fi=float(i);vec2 o=(vec2(h11(fi*3.+uSeed.w),h11(fi*7.+uSeed.z))-.5)*vec2(1.6,.9);float r=.05+.09*h11(fi*5.);
  bg=mix(bg,mix(bg,pal(.5+.4*h11(fi*9.)),.55),smoothstep(r,r*.6,length(p-o-.02*vec2(sin(T+fi),cos(T+fi))))*.6);}
 float t=0.;vec2 h;bool hit=false;
 for(int i=0;i<110;i++){h=map(ro+rd*t);if(h.x<.0008){hit=true;break;}t+=h.x;if(t>dist*3.)break;}
 vec3 col=bg;
 if(hit){vec3 pos=ro+rd*t;vec2 e=vec2(.0015,0.);vec3 n=normalize(vec3(map(pos+e.xyy).x-map(pos-e.xyy).x,map(pos+e.yxy).x-map(pos-e.yxy).x,map(pos+e.yyx).x-map(pos-e.yyx).x));
  float sh=1.,st=.02;for(int k=0;k<28;k++){float d=map(pos+n*.002+L*st).x;sh=min(sh,10.*d/st);st+=clamp(d,.01,.2);if(sh<.01||st>2.)break;}sh=clamp(sh,0.,1.);
  float ao=0.;for(int k=1;k<5;k++){float hk=float(k)*.035;ao+=hk-map(pos+n*hk).x;}ao=clamp(1.-ao*4.,0.,1.);
  float dif=max(dot(n,L),0.);float fr=pow(1.-max(dot(n,-rd),0.),3.);vec3 hv=normalize(L-rd);float spc=pow(max(dot(n,hv),0.),40.);
  vec3 base=uP.x<.6?uPal[2]:(uP.x<.85?uPal[1]:uPal[3]);if(lum(base)<.22)base=mix(base,uPal[4],.35);
  float mat=uW4.y;
  if(h.y<.5){col=mix(bg,mix(uPal[4],uPal[3],.5),.5)*(.55+.45*sh)*(.6+.4*ao);col=mix(col,bg,smoothstep(1.,3.,length(pos.xz)));}
  else if(h.y<1.5){vec3 a=base;float pat=uW4.z;vec3 lp=pos-vec3(0.,LH+BH,0.);
   if(pat>.5&&pat<1.5)a=mix(a,mix(uPal[4],vec3(1.),.3),smoothstep(.02,0.,length((lp-vec3(0.,-BH*.15,BW*.8))/vec3(BW*.6,BH*.6,BW*.5))-1.)*.8);
   else if(pat>1.5&&pat<2.5)a=mix(a,a*.72,step(.68,n3l(pos*13.+uSeed.xyz*10.)));
   else if(pat>2.5)a=mix(a,a*.75,step(.5,fract(pos.y*13.+n3l(pos*6.)*.6))*step(pos.y,FC.y-FR*.4));
   vec2 fq=(pos.xy-FC.xy);float face=step(.2,n.z);
   vec2 mq=fq+vec2(0.,FR*.3+FR*.15*uW3.y*.4);float w=FR*.11;float mo=uW4.x;float mouth=0.;
   if(mo<.5)mouth=smoothstep(.006,0.,abs(length(mq-vec2(0.,w*.9))-w)-w*.16)*step(mq.y,w*.5);
   else if(mo<1.5)mouth=step(length(mq/vec2(w*.8,w*.6)),1.);else if(mo<2.5){for(int k=0;k<2;k++){float s=float(k)*2.-1.;vec2 m2=mq-vec2(s*w*.48,w*.45);mouth=max(mouth,smoothstep(.006,0.,abs(length(m2)-w*.48)-w*.14)*step(m2.y,0.));}}
   else mouth=step(length(mq/vec2(w*.35,w*.42)),1.);
   a=mix(a,vec3(.08,.05,.07),mouth*face);
   float cx=uW3.x<1.5?FR*.5:FR*uW3.z+FR*.15*uW3.y*1.1;for(int k=0;k<2;k++){float s=float(k)*2.-1.;a=mix(a,vec3(1.,.45,.55),smoothstep(1.,.6,length((fq-vec2(s*cx,-FR*.15*uW3.y*1.15))/vec2(FR*.13,FR*.08)))*.45*face);}
   if(mat<.5){col=a*(dif*sh>.3?1.:.72)*(.75+.25*ao)+fr*.15;}
   else if(mat<1.5){col=a*(.3+.85*dif*sh)*(.6+.4*ao)+spc*sh*.35+a*fr*.35;}
   else if(mat<2.5){col=mix(a*.55,a*1.3,fr)*(.45+.6*dif*sh)+spc*sh*1.1+a*.25;}
   else{col=a*(.35+.7*dif*sh)*(.7+.3*ao)+a*fr*.5;}}
  else if(h.y<2.5){vec3 ac=uW1.z<3.5?mix(uPal[3],uPal[4],.5):vec3(.95,.9,.8);col=ac*(.4+.7*dif*sh)+spc*.5;}
  else{col=vec3(.03)*(.6+.4*ao)+spc*1.6+pow(max(dot(n,normalize(vec3(.4,.6,1.))),0.),60.)*.8;}
  col=mix(col,bg,smoothstep(dist*1.6,dist*2.6,t));}
 return col;}
`;
