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
  gl_FragColor=vec4(clamp(c,0.,1.),1.);
}`;
