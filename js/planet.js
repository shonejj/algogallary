// Planets seen from orbit: 3D-noise continents/oceans/ice, gas-giant bands, rotating cloud decks,
// atmosphere scattering rim, night-side city lights, rings with planet shadow, moons, starfield + nebula.
export const PLANET_GLSL = `
uniform vec4 uW0; // kind(0 terran,1 gas giant,2 ice,3 lava,4 alien), sea level, cloudiness, city lights
uniform vec4 uW1; // radius, tilt, ring(0/1), ring width
uniform vec4 uW2; // sun azimuth, sun elevation, moons(0..2), atmosphere
uniform vec4 uW3; // spin(int), feature scale, storm, nebula
float h31(vec3 p){p=fract(p*.1031);p+=dot(p,p.zyx+31.32);return fract((p.x+p.y)*p.z);}
float n3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(h31(i),h31(i+vec3(1.,0.,0.)),f.x),mix(h31(i+vec3(0.,1.,0.)),h31(i+vec3(1.,1.,0.)),f.x),f.y),
  mix(mix(h31(i+vec3(0.,0.,1.)),h31(i+vec3(1.,0.,1.)),f.x),mix(h31(i+vec3(0.,1.,1.)),h31(i+vec3(1.,1.,1.)),f.x),f.y),f.z);}
float f3(vec3 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n3(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=.5;}return v/.97;}
mat3 rY(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
mat3 rX(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
float sph(vec3 ro,vec3 rd,vec3 c,float r){vec3 oc=ro-c;float b=dot(oc,rd);float h=b*b-dot(oc,oc)+r*r;return h<0.?-1.:-b-sqrt(h);}
vec3 surface(vec3 q,vec3 n,vec3 L,float lit){float k=uW0.x;vec3 c;float fs=uW3.y;
 if(k>.5&&k<1.5){float b=q.y*(6.+fs*6.)+f3(q*vec3(2.,7.,2.)+uSeed.xyz*5.)*2.2;c=pal(.5+.5*sin(b));c=mix(c,pal(.5+.5*sin(b*2.3+1.)),.35);
  vec3 sp=normalize(vec3(.6,-.25,.75));float st=smoothstep(.12,.0,length((q-sp)*vec3(1.,2.2,1.)))*uW3.z;c=mix(c,mix(uPal[3],uPal[4],.4),st*(.6+.4*sin(atan(q.z-sp.z,q.x-sp.x)*3.)));return c;}
 float h=f3(q*(1.6+fs*2.)+uSeed.xyz*9.);float sea=uW0.y;
 if(k>2.5&&k<3.5){float cr=smoothstep(.04,0.,abs(h-.52));c=mix(uPal[0]*.6,uPal[1],smoothstep(.3,.7,h));c+=mix(uPal[3],vec3(1.,.6,.2),.5)*cr*1.4*(1.-lit*.5);return c;}
 if(h<sea){float dd=(sea-h)/sea;c=mix(mix(uPal[2],uPal[4],.25),mix(uPal[0],uPal[1],.6),smoothstep(0.,.25,dd));if(k>1.5&&k<2.5)c=mix(c,vec3(.85,.92,1.),.6);}
 else{float e=(h-sea)/(1.-sea);c=k>3.5?pal(.35+.6*e):mix(mix(uPal[3],uPal[2],.5),mix(uPal[1],uPal[0],.3),smoothstep(.05,.5,e));c=mix(c,vec3(.95),smoothstep(.55,.75,e));}
 float lat=abs(q.y);c=mix(c,vec3(.94,.97,1.),smoothstep(k>1.5&&k<2.5?.3:.72,k>1.5&&k<2.5?.5:.82,lat+(h-.5)*.2));
 if(h>sea&&uW0.w>0.){float city=step(.72,n3(q*60.))*step(.55,n3(q*9.));c+=mix(uPal[3],vec3(1.,.8,.45),.5)*city*uW0.w*1.6*(1.-lit);}
 return c;}
vec3 gen(){vec2 p=uv0();vec3 ro=vec3(0.,0.,3.4);vec3 rd=normalize(vec3(p,-1.7));
 float R=uW1.x;vec3 C=vec3((uSeed.x-.5)*.9,(uSeed.y-.5)*.5,0.);
 vec3 L=normalize(vec3(cos(uW2.x*TAU),uW2.y,sin(uW2.x*TAU)*.6+.6));
 vec3 c=uPal[0]*.25;float neb=fbm(p*1.6+uSeed.zw*9.+L.xy*0.);c+=pal(.3+.4*neb)*pow(neb,2.5)*uW3.w*1.2;
 vec2 g=floor(gl_FragCoord.xy/max(1.,uRes.y/700.));float s=h21(g+uSeed.xy*30.);c+=step(.996,s)*(.6+.4*sin(T*2.+s*60.));
 vec3 sunp=ro+L*40.;float sdir=dot(rd,L);c+=mix(uPal[4],vec3(1.),.5)*(pow(max(sdir,0.),400.)*2.+pow(max(sdir,0.),20.)*.15);
 mat3 M=rY(T*uW3.x+uSeed.z*6.)*rX(uW1.y);
 vec3 rn=normalize(rX(uW1.y)*vec3(0.,1.,0.));
 float tP=sph(ro,rd,C,R);float tR=-1.;vec3 ringc=vec3(0.);float ringa=0.;
 if(uW1.z>.5){float den=dot(rd,rn);if(abs(den)>1e-3){float tt=dot(C-ro,rn)/den;if(tt>0.){vec3 hp=ro+rd*tt;float r=length(hp-C)/R;
   if(r>1.25&&r<1.25+uW1.w){float u=(r-1.25)/uW1.w;float band=.5+.5*sin(u*60.+n3(vec3(u*30.,0.,0.))*6.);ringa=smoothstep(0.,.05,u)*smoothstep(1.,.85,u)*(.35+.6*band);
    ringc=mix(uPal[3],uPal[4],band)*(.4+.6*max(dot(rn,L)*sign(dot(rn,-rd)),.15));
    vec3 tl=normalize(L);float sh=sph(hp,tl,C,R);if(sh>0.)ringc*=.25;tR=tt;}}}}
 for(int k=0;k<2;k++){if(float(k)>=uW2.z)break;float fk=float(k);float a=T*float(k+1)+uSeed.w*6.+fk*2.;vec3 mc=C+vec3(cos(a)*R*(1.9+fk*.6),sin(a)*R*.25,sin(a)*R*(1.9+fk*.6));float mr=R*(.12+.08*fk);
  float tm=sph(ro,rd,mc,mr);if(tm>0.&&(tP<0.||tm<tP)){vec3 n=normalize(ro+rd*tm-mc);float cr=.8+.2*n3(n*14.);c=mix(uPal[2],uPal[4],.5)*cr*(.08+max(dot(n,L),0.));tP=-2.;}}
 if(tR>0.&&(tP<0.||tR<tP)&&tP!=-2.){c=mix(c,ringc,ringa*.9);}
 if(tP>0.){vec3 pos=ro+rd*tP;vec3 n=normalize(pos-C);vec3 q=M*n;float dl=dot(n,L);float lit=smoothstep(-.12,.25,dl);
  vec3 sc=surface(q,n,L,lit);
  if(uW0.x<.5||uW0.x>1.5){float cl=f3(rY(T*float(int(uW3.x)+1))*q*3.+11.);float cm=smoothstep(.62-uW0.z*.25,.85,cl)*uW0.z*1.3;sc=mix(sc,vec3(.97),clamp(cm,0.,1.));}
  vec3 col=sc*(.04+1.1*max(dl,0.))+sc*.03;
  float spec=pow(max(dot(reflect(-L,n),-rd),0.),40.)*.3*step(f3(q*(1.6+uW3.y*2.)+uSeed.xyz*9.),uW0.y)*step(uW0.x,.5);col+=spec;
  if(uW0.w>0.&&dl<.1)col+=sc*0.;
  float rim=pow(1.-max(dot(n,-rd),0.),2.5);vec3 atm=mix(uPal[2],uPal[4],.4);col+=atm*rim*uW2.w*(.15+1.2*smoothstep(-.3,.4,dl));
  c=col;if(tR>0.&&tR<tP)c=mix(c,ringc,ringa*.9);}
 float dc=length(cross(rd,normalize(C-ro)));float ang=acos(clamp(dot(rd,normalize(C-ro)),-1.,1.));float pr=asin(clamp(R/length(C-ro),0.,1.));
 if(tP<0.&&tP!=-2.)c+=mix(uPal[2],uPal[4],.4)*uW2.w*.6*exp(-max(ang-pr,0.)*40.)*smoothstep(-.4,.4,dot(normalize(rd-normalize(C-ro)),L));
 return c;}
`;
const KINDS = ['terran', 'gas giant', 'ice world', 'lava world', 'alien world'];
export function planetConfig(rng, kind = null) {
  const k = kind != null ? kind : rng.pick([0, 0, 1, 1, 2, 3, 4]);
  const W = [k, rng.float(0.42, 0.6), k === 1 ? 0 : rng.float(0.2, 1), k === 0 || k === 4 ? (rng.chance(0.5) ? rng.float(0.4, 1) : 0) : 0,
    rng.float(0.55, 1.05), rng.float(-0.5, 0.5), rng.chance(k === 1 ? 0.75 : 0.35) ? 1 : 0, rng.float(0.5, 1.3),
    rng.next(), rng.float(-0.3, 0.5), rng.int(0, 2), rng.float(0.5, 1.2),
    rng.pick([1, 1, 2]), rng.next(), rng.chance(0.5) ? rng.next() : 0, rng.float(0.2, 1)];
  while (W.length < 20) W.push(0);
  const desc = [KINDS[k], W[6] ? 'rings' : '', W[10] ? W[10] + ' moon' + (W[10] > 1 ? 's' : '') : '', W[3] ? 'city lights' : ''].filter(Boolean).join(' · ');
  return { W, desc, pals: k === 3 ? ['mars', 'lava', 'desert'] : k === 1 ? ['desert', 'sunset', 'oceandusk', 'opal', 'dawnpeach', 'random'] : k === 2 ? ['arctic', 'glacier', 'ice'] : k === 4 ? ['magalien', 'emerald', 'alien', 'random'] : ['oceandusk', 'tealdusk', 'jungle', 'alpine', 'earth'] };
}
