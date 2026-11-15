// Shared GLSL (WebGL1 / GLSL ES 1.00 for maximum device compatibility)
const PREC = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`;

const LIB = `
#define TAU 6.28318530718
#define PI 3.14159265359
uniform vec3 uPal[5];
float h11(float p){p=fract(p*.1031);p*=p+33.33;p*=p+p;return fract(p);}
float h21(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
vec2 h22(vec2 p){vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));p3+=dot(p3,p3.yzx+33.33);return fract((p3.xx+p3.yz)*p3.zy);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1.,0.)),u.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){v+=a*noise(p);p=m*p;a*=.5;}return v/.96875;}
float fbm3(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<3;i++){v+=a*noise(p);p=m*p;a*=.5;}return v/.875;}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
vec3 palAt(float i){if(i<.5)return uPal[0];if(i<1.5)return uPal[1];if(i<2.5)return uPal[2];if(i<3.5)return uPal[3];return uPal[4];}
vec3 pal(float t){t=clamp(t,0.,1.)*4.;float i=floor(min(t,3.999));return mix(palAt(i),palAt(i+1.),t-i);}
vec3 palc(float t){return pal(abs(fract(t)*2.-1.));}
float lum(vec3 c){return dot(c,vec3(.299,.587,.114));}
`;

export const GEN_HEADER = `#extension GL_OES_standard_derivatives : enable
${PREC}
uniform vec2 uRes; uniform float uTime; uniform float uPhase; uniform vec4 uSeed; uniform vec4 uP;
float T; vec2 L;
${LIB}
vec2 uv0(){return (gl_FragCoord.xy-.5*uRes)/min(uRes.x,uRes.y);}
float pxs(){return 1./min(uRes.x,uRes.y);}
float fill(float d){float e=pxs()*1.2;return smoothstep(e,-e,d);}
float stroke(float d,float w){float e=pxs()*1.2;return smoothstep(w+e,w-e,abs(d));}
float sdBox(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
float sdSeg(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h);}
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
`;

export const GEN_MAIN = `
void main(){T=uPhase*TAU;L=vec2(cos(T),sin(T));gl_FragColor=vec4(clamp(gen(),0.,1.),1.);}
`;

export const VERT = `attribute vec2 aPos;void main(){gl_Position=vec4(aPos,0.,1.);}`;

// Post-processing uber shader. Modes: 0 none,1 bayer,2 halftone,3 ascii,4 matrix,5 stipple,6 gradient map
export const FX_FRAG = `${PREC}
uniform sampler2D uTex; uniform sampler2D uGlyph;
uniform vec2 uRes; uniform float uPhase; uniform float uTime; uniform float uK;
uniform vec4 uA; // grain, vignette, scan, ca
uniform vec4 uB; // glitch, pixel, posterize, curve
uniform vec4 uC; // leak, paper, mode, cell
uniform vec4 uD; // tone(0 palette,1 two-tone,2 source), bloom, contrast, -
uniform sampler2D uPrev; uniform vec4 uTr; // progress, mode
${LIB}
float bayer2(vec2 a){a=floor(a);return fract(a.x/2.+a.y*a.y*.75);}
float bayer4(vec2 a){return bayer2(.5*a)*.25+bayer2(a);}
float bayer8(vec2 a){return bayer4(.5*a)*.25+bayer2(a);}
vec3 samp(vec2 uv){
  if(uA.w>0.){vec2 d=(uv-.5)*uA.w*.014;
    return vec3(texture2D(uTex,uv+d).r,texture2D(uTex,uv).g,texture2D(uTex,uv-d).b);}
  return texture2D(uTex,uv).rgb;}
float con(float l){return clamp((l-.5)*uD.z+.5,0.,1.);}
float glyph(float idx,float row,vec2 f){
  f=clamp(f,.02,.98);
  vec2 g=vec2((idx+f.x)/16.,(row==0.?.5:0.)+f.y*.5);
  return texture2D(uGlyph,g).r;}
void main(){
  vec2 fc=gl_FragCoord.xy; vec2 uv=fc/uRes; vec2 uvo=uv;
  if(uB.w>0.){vec2 cc=uv*2.-1.;cc*=1.+uB.w*.25*dot(cc,cc);uv=cc*.5+.5;
    if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.){gl_FragColor=vec4(0.,0.,0.,1.);return;}}
  float st=floor(uTime*12.);
  if(uB.x>0.){float band=floor(uv.y*28.+h21(vec2(st,1.))*9.);float r=h21(vec2(band,st));
    if(r>1.-uB.x*.3)uv.x+=(h21(vec2(band,st+5.))-.5)*.16*uB.x;}
  if(uB.y>1.){vec2 px=vec2(uB.y*uK)/uRes;uv=(floor(uv/px)+.5)*px;}
  float mode=uC.z; float cell=max(uC.w*uK,1.);
  vec3 c;
  if(mode<.5){c=samp(uv);
    if(uD.y>0.){vec3 b=vec3(0.);for(int i=0;i<8;i++){float a=float(i)*.785;vec2 o=vec2(cos(a),sin(a))*8.*uK/uRes;
      vec3 s=texture2D(uTex,uv+o).rgb;b+=max(s-.55,0.);}c+=b*uD.y*.35;}
  } else if(mode<1.5){
    vec2 g=floor(fc/cell);vec3 s=samp((g+.5)*cell/uRes);float l=con(lum(s));float b=bayer8(g);
    if(uD.x<.5){c=palAt(clamp(floor(l*4.+b),0.,4.));}
    else if(uD.x<1.5){c=(l+(b-.5)*.95>.5)?uPal[4]:uPal[0];}
    else{c=floor(s*3.+b)/3.;}
  } else if(mode<2.5){
    if(uD.x>1.5){
      vec3 ink=vec3(0.);
      for(int k=0;k<3;k++){float ang=float(k)==0.?.26:(float(k)==1.?1.31:0.);
        mat2 R=rot(ang);vec2 q=R*fc/cell;vec2 cid=floor(q)+.5;vec2 ctr=(cid*cell)*R;
        vec3 s=samp(ctr/uRes);float cov=1.-(k==0?s.r:(k==1?s.g:s.b));
        float r=sqrt(clamp(cov,0.,1.))*.62;float d=length(fract(q)-.5);
        float v=smoothstep(r+.06,r-.06,d);
        if(k==0)ink.r=v;else if(k==1)ink.g=v;else ink.b=v;}
      c=uPal[4]*(vec3(1.)-ink*.92);
    } else {
      mat2 R=rot(.785);vec2 q=R*fc/cell;vec2 cid=floor(q)+.5;vec2 ctr=(cid*cell)*R;
      vec3 s=samp(ctr/uRes);float l=con(lum(s));float r=sqrt(1.-l)*.66;float d=length(fract(q)-.5);
      float v=smoothstep(r+.07,r-.07,d);
      vec3 ink=uD.x<.5?s*.85:uPal[0];c=mix(uPal[4],ink,v);
    }
  } else if(mode<4.5){
    vec2 g=floor(fc/cell);vec2 f=fract(fc/cell);vec3 s=samp((g+.5)*cell/uRes);float l=con(lum(s));
    float gl;
    if(mode<3.5){gl=glyph(floor(clamp(l,0.,.999)*10.),0.,f);}
    else{float sp=floor(uTime*(2.+h21(g.xx)*6.));gl=glyph(floor(h21(g+sp)*16.),1.,f);
      float col=fract(h21(g.xx*1.7)+uTime*(.15+h21(g.xx)*.3)-g.y*.02);l*=.35+.65*pow(col,3.);}
    vec3 fg=uD.x<.5?pal(.35+.65*l):(uD.x<1.5?uPal[4]*l:s);
    c=mix(uPal[0],fg,gl*(mode<3.5?1.:l*1.6));
  } else if(mode<5.5){
    vec2 g=floor(fc/cell);float ink=0.;
    for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 n=g+vec2(float(i),float(j));
      vec2 pos=n+.2+.6*h22(n);vec3 s=samp(pos*cell/uRes);float l=con(lum(s));
      float r=sqrt(1.-l)*.75;float d=length(fc/cell-pos);ink=max(ink,smoothstep(r,r-.25,d));}
    c=mix(uPal[4],uPal[0],ink);
  } else {
    vec3 s=samp(uv);c=pal(con(lum(s)));
  }
  if(uB.z>1.)c=floor(c*uB.z+.5)/uB.z;
  if(uC.x>0.){c+=uC.x*vec3(1.,.42,.18)*smoothstep(.95,0.,length(uvo-vec2(1.05,.2+.25*sin(uPhase*TAU))))*.7;
    c+=uC.x*vec3(.9,.2,.5)*smoothstep(.7,0.,length(uvo-vec2(-.05,.95)))*.35;}
  if(uC.y>0.){float pn=noise(fc*.35/uK)*.5+noise(fc*.04/uK)*.5;float fib=smoothstep(.75,.95,noise(vec2(fc.x*.02,fc.y*.6)/uK));
    c*=mix(1.,.9+.1*pn-.05*fib,uC.y);}
  if(uA.z>0.)c*=1.-uA.z*(.5-.5*cos(fc.y*TAU/(3.*max(uK,1.))))*.5;
  if(uA.y>0.){vec2 v=uvo-.5;c*=clamp(1.-uA.y*dot(v,v)*2.4,0.,1.);}
  if(uA.x>0.)c+=(h21(fc+fract(uTime*7.31)*917.)-.5)*uA.x;
  if(uTr.x<1.){float t=uTr.x;float m=uTr.y;vec2 u=uvo;float asp=uRes.x/uRes.y;
    if(m<.5){float n=noise(fc/uRes.y*7.)*.65+noise(fc/uRes.y*28.)*.35;float th=t*1.3-.15;
      c=mix(c,texture2D(uPrev,u).rgb,smoothstep(th,th+.05,n));c+=uPal[4]*smoothstep(.05,0.,abs(n-th))*(1.-t)*.9;}
    else if(m<1.5){float r=length((u-.5)*vec2(asp,1.));float R=t*(asp*.6+.6);float k=smoothstep(R,R-.03,r);
      c=mix(texture2D(uPrev,(u-.5)*(1.-t*.15)+.5).rgb,c,k);c+=uPal[4]*smoothstep(.02,0.,abs(r-R))*(1.-t);}
    else if(m<2.5){float e=t*1.4-.2+.04*sin(u.y*18.+t*6.);float k=smoothstep(e,e+.08,u.x);c=mix(c,texture2D(uPrev,u+vec2(t*.15,0.)).rgb,k);}
    else if(m<3.5){float px=max(1.,sin(t*PI)*48.)*uK;vec2 q=(floor(fc/px)+.5)*px/uRes;
      c=t<.5?texture2D(uPrev,q).rgb:mix(texture2D(uTex,q).rgb,c,smoothstep(.6,1.,t));}
    else if(m<4.5){float band=floor(u.y*24.);float r=h21(vec2(band,floor(t*10.)));float sh=(h21(vec2(band,3.))-.5)*.2*(1.-t);
      c=r<t?c:texture2D(uPrev,u+vec2(sh,0.)).rgb;c.r=mix(c.r,texture2D(uPrev,u+vec2(.02,0.)).r,(1.-t)*.5*step(.7,r));}
    else if(m<5.5){vec2 d=u-.5;float w=sin(length(d*vec2(asp,1.))*40.-t*20.)*.012*sin(t*PI);
      vec3 a=texture2D(uPrev,u+normalize(d+.0001)*w).rgb;c=mix(a,c,smoothstep(.2,.8,t));}
    else{vec3 a=texture2D(uPrev,(u-.5)*(1.-t*.12)+.5).rgb;c=mix(a,c,smoothstep(0.,1.,t));}
  }
  gl_FragColor=vec4(clamp(c,0.,1.),1.);
}`;

// Composite: blend layer B into A through a mask, with UV transforms, displacement and colour grading.
export const COMP_FRAG = `${PREC}
uniform sampler2D uA; uniform sampler2D uB; uniform sampler2D uM;
uniform vec2 uRes; uniform float uPhase; uniform vec4 uS;
uniform vec4 uC0; // blend, amount, maskMode, threshold
uniform vec4 uC1; // xformA, xformB, xformAmt, warp
uniform vec4 uC2; // shape, softness, invert, hueShift
uniform vec4 uC3; // saturation, shapeScale, shapeRot, hasB
${LIB}
vec2 mw(vec2 u){return 1.-abs(1.-mod(u,2.));}
vec2 xf(vec2 uv,float m,float a){
 if(m<.5)return uv;
 float asp=uRes.x/uRes.y;vec2 c=uv-.5;c.x*=asp;
 if(m<1.5){float n=floor(3.+a*9.);float r=length(c);float an=atan(c.y,c.x)+uPhase*TAU/n;an=mod(an,TAU/n);an=abs(an-PI/n);c=r*vec2(cos(an),sin(an));}
 else if(m<2.5){c=abs(c)-.25*a;}
 else if(m<3.5){float n=floor(2.+a*4.);return mw(uv*n+vec2(uPhase*(a>.5?1.:0.),0.));}
 else if(m<4.5){return mw(vec2(atan(c.y,c.x)/TAU+.5+uPhase,length(c)*(1.2+a)));}
 else if(m<5.5){float r=length(c);c*=rot((a*5.+.5)*(1.-smoothstep(0.,.8,r))+sin(uPhase*TAU)*.4);}
 else if(m<6.5){float r=length(c);c*=(1.-a*.5)+a*1.4*r*r;}
 else{c*=rot(uPhase*TAU*(a>.5?1.:-1.))*(1.+.15*sin(uPhase*TAU));}
 c.x/=asp;return mw(c+.5);}
float shape(vec2 q,float k){float r=length(q);float a=atan(q.y,q.x);
 if(k<.5)return r-.32;
 if(k<1.5){vec2 b=q-vec2(0.,-.1);float bx=max(abs(b.x)-.24,abs(b.y)-.3);float top=length(q-vec2(0.,.2))-.24;return q.y>.2?top:bx;}
 if(k<2.5){float st=cos(floor(.5+a/(TAU/5.))*(TAU/5.)-a)*r;return st-.22-.12*cos(a*5.)*0.;}
 if(k<3.5){vec2 h=q*1.2;h.y-=.08;float d=pow(h.x*h.x+h.y*h.y-.09,3.)-h.x*h.x*h.y*h.y*h.y*1.;return d*12.;}
 if(k<4.5)return max(r-.32,-(length(q-vec2(.13,.08))-.28));
 if(k<5.5)return abs(q.x)+abs(q.y)-.36;
 if(k<6.5)return abs(r-.28)-.07;
 if(k<7.5)return r-.24-.08*cos(a*6.);
 if(k<8.5){vec2 h=abs(q);return max(h.x*.866+h.y*.5,h.y)-.3;}
 if(k<9.5){vec2 g=fract(q*4.)-.5;return (length(g)-.32)/4.;}
 if(k<10.5)return sin(q.y*28.)*.03;
 return r-.28-.08*(noise(vec2(a*2.,0.)+uS.xy*20.)-.5)*2.-.03*sin(a*3.+uPhase*TAU);}
vec3 blend(vec3 a,vec3 b,float m){
 if(m<.5)return b;if(m<1.5)return a*b;if(m<2.5)return 1.-(1.-a)*(1.-b);
 if(m<3.5)return mix(2.*a*b,1.-2.*(1.-a)*(1.-b),step(.5,a));
 if(m<4.5)return abs(a-b);if(m<5.5)return min(a+b,1.);
 if(m<6.5)return mix(2.*a*b+a*a*(1.-2.*b),sqrt(a)*(2.*b-1.)+2.*a*(1.-b),step(.5,b));
 if(m<7.5)return min(a/max(1.-b,.02),1.);
 if(m<8.5){float la=lum(a);float lb=lum(b);return clamp(b+(la-lb),0.,1.);}
 if(m<9.5)return texture2D(uB,vec2(clamp(lum(a),.01,.99),.5)).rgb;
 if(m<10.5)return b;
 return a+b-2.*a*b;}
vec3 hueRot(vec3 c,float h){const vec3 k=vec3(.57735);float ca=cos(h*TAU);return c*ca+cross(k,c)*sin(h*TAU)+k*dot(k,c)*(1.-ca);}
void main(){vec2 uv=gl_FragCoord.xy/uRes;float asp=uRes.x/uRes.y;
 vec2 ua=xf(uv,uC1.x,uC1.z);vec2 ub=xf(uv,uC1.y,1.-uC1.z);
 if(uC1.w>0.&&uC3.w>.5){vec3 w=texture2D(uB,ub).rgb;ua=mw(ua+(w.rg-.5)*uC1.w*.25);}
 vec3 a=texture2D(uA,ua).rgb;
 vec3 b=uC3.w>.5?texture2D(uB,ub).rgb:mix(uPal[0],uPal[1],uv.y);
 float mm=uC0.z;float m=1.;
 if(mm>.5&&mm<1.5)m=smoothstep(uC0.w-uC2.y,uC0.w+uC2.y,lum(texture2D(uM,uv).rgb));
 else if(mm<2.5&&mm>1.5){vec2 q=(uv-.5)*vec2(asp,1.);q=rot(uC3.z)*q/max(uC3.y,.2);m=smoothstep(uC2.y*.5,-uC2.y*.5,shape(q,uC2.x));}
 else if(mm<3.5&&mm>2.5)m=smoothstep(uC0.w-uC2.y,uC0.w+uC2.y,fbm((uv-.5)*vec2(asp,1.)*2.5+uS.xy*20.+vec2(cos(uPhase*TAU),sin(uPhase*TAU))*.3));
 else if(mm<4.5&&mm>3.5)m=smoothstep(uC0.w-uC2.y,uC0.w+uC2.y,lum(a));
 else if(mm<5.5&&mm>4.5){float e=uv.x+.08*sin(uv.y*7.+uS.x*6.+uPhase*TAU)+(uv.y-.5)*(uS.y-.5);m=smoothstep(uC0.w-uC2.y*.3,uC0.w+uC2.y*.3,e);}
 else if(mm>5.5)m=smoothstep(0.,1.,uv.y*1.2-.1);
 if(uC2.z>.5)m=1.-m;
 vec3 c=mix(a,blend(a,b,uC0.x),clamp(m*uC0.y,0.,1.));
 if(uC2.w!=0.)c=hueRot(c,uC2.w);
 float l=lum(c);c=mix(vec3(l),c,uC3.x);
 gl_FragColor=vec4(clamp(c,0.,1.),1.);}`;
