/**
 * FRIDAY Core — a living computational core, not an orb. Shaders for:
 *   energy reactor (bright blue-white heart) · computational rings (segmented,
 *   with data pulses travelling them) · data-stream particles (light highways on
 *   orbits) · atmosphere (the core illuminating its environment).
 */

const SNOISE = /* glsl */ `
vec3 mod289(vec3 x){return x - floor(x * (1.0/289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0/289.0)) * 289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx; vec3 x2 = x0 - i2 + C.yyy; vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857; vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy; vec4 y = y_ * ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0; vec4 s1 = floor(b1)*2.0 + 1.0; vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x); vec3 p1 = vec3(a0.zw, h.y); vec3 p2 = vec3(a1.xy, h.z); vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0); m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
float fbm(vec3 p){ float a=0.5,f=1.0,s=0.0; for(int i=0;i<5;i++){ s+=a*snoise(p*f); f*=2.03; a*=0.5; } return s; }
`;

/* --------------------------- energy reactor ---------------------------- */
export const coreVertex = /* glsl */ `
uniform float uTime, uBreathe, uActivity, uAudio;
varying vec3 vNormal; varying vec3 vView; varying vec3 vPos;
${SNOISE}
void main(){
  vec3 p = position; float t = uTime;
  float n = fbm(normal*2.2 + vec3(t*0.4));
  p += normal * (n*0.06 + uBreathe + uAudio*0.05);
  vNormal = normalize(mat3(modelMatrix)*normal);
  vec4 w = modelMatrix*vec4(p,1.0);
  vView = normalize(cameraPosition - w.xyz); vPos = p;
  gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0);
}`;

export const coreFragment = /* glsl */ `
precision highp float;
uniform float uTime, uActivity, uAlert, uPulse;
uniform vec3 uCore, uGlow;
varying vec3 vNormal; varying vec3 vView; varying vec3 vPos;
${SNOISE}
void main(){
  vec3 N = normalize(vNormal); vec3 V = normalize(vView);
  float facing = max(dot(N,V), 0.0);
  float center = pow(facing, 1.7);                 // white-hot heart toward the eye
  float flow = fbm(vPos*3.0 + vec3(0.0,uTime*0.5,0.0))*0.5 + 0.5;
  float fil = pow(fbm(vPos*6.0 + vec3(uTime*0.8)), 2.0); // plasma filaments
  vec3 col = mix(uGlow, vec3(1.4,1.5,1.6), center*0.85); // core blue-white
  col *= (0.5 + uActivity*1.7);
  col += uGlow * flow * 0.5 + uCore * fil * 0.7;
  col += vec3(1.0) * pow(facing, 6.0) * (0.6 + uPulse*1.5); // bright specular pop, pulses with voice
  vec3 alertC = vec3(1.0, 0.20, 0.26);
  col = mix(col, alertC*(0.9+0.6*sin(uTime*8.0)), uAlert);
  float a = mix(0.95, 0.4, 1.0-facing);
  gl_FragColor = vec4(col, a);
}`;

/* -------------------------- computational ring ------------------------- */
export const ringVertex = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;

export const ringFragment = /* glsl */ `
precision highp float;
uniform float uTime, uSpeed, uSegs, uBright;
uniform vec3 uColor;
varying vec2 vUv;
void main(){
  // segmented "computational" dashes
  float seg = smoothstep(0.45, 0.5, abs(fract(vUv.x*uSegs)-0.5)) ;
  // bright data pulses travelling around the ring
  float travel = pow(fract(vUv.x - uTime*uSpeed), 10.0);
  float travel2 = pow(fract(vUv.x*0.5 + uTime*uSpeed*0.6), 18.0);
  // thin profile across the tube
  float prof = smoothstep(1.0, 0.0, abs(vUv.y-0.5)*2.0);
  float b = (0.22*seg + travel*2.6 + travel2*1.8) * prof * uBright;
  gl_FragColor = vec4(uColor*b + vec3(1.0)*travel*0.6, b);
}`;

/* ---------------------------- data streams ----------------------------- */
export const dataVertex = /* glsl */ `
attribute float aRadius, aTilt, aPhase, aSpeed, aSeed;
uniform float uTime, uFlow, uSize;
varying float vSeed; varying float vHead;
void main(){
  float ang = uTime*aSpeed*uFlow + aPhase*6.28318;
  vec3 c = vec3(cos(ang), sin(ang), 0.0)*aRadius;
  float ct=cos(aTilt), st=sin(aTilt);
  vec3 p = vec3(c.x, c.y*ct - c.z*st, c.y*st + c.z*ct);   // tilt orbital plane (X)
  float cy=cos(aSeed*6.28318), sy=sin(aSeed*6.28318);
  p = vec3(p.x*cy + p.z*sy, p.y, -p.x*sy + p.z*cy);       // spin plane (Y)
  vec4 mv = modelViewMatrix*vec4(p,1.0);
  gl_Position = projectionMatrix*mv;
  vSeed = aSeed;
  vHead = 0.5 + 0.5*sin(ang*1.0 + aSeed*30.0);            // travels bright→dim like a comet
  gl_PointSize = uSize * (0.5+aRadius) * (0.6+vHead) * (240.0/-mv.z);
}`;

export const dataFragment = /* glsl */ `
precision highp float;
uniform vec3 uColor; uniform vec3 uWhite;
varying float vSeed; varying float vHead;
void main(){
  vec2 uv = gl_PointCoord-0.5; float d=length(uv);
  float a = smoothstep(0.5,0.0,d);
  vec3 col = mix(uColor, uWhite, step(0.78, vSeed));   // a few white "data" motes
  gl_FragColor = vec4(col*(0.6+vHead*1.2), a*(0.3+vHead*0.7));
}`;

/* ----------------------------- atmosphere ------------------------------ */
export const atmoVertex = /* glsl */ `
varying vec3 vNormal; varying vec3 vView;
void main(){
  vNormal = normalize(mat3(modelMatrix)*normal);
  vec4 w = modelMatrix*vec4(position,1.0);
  vView = normalize(cameraPosition - w.xyz);
  gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);
}`;

export const atmoFragment = /* glsl */ `
precision highp float;
uniform vec3 uGlow; uniform float uGain;
varying vec3 vNormal; varying vec3 vView;
void main(){
  vec3 N=normalize(vNormal); vec3 V=normalize(vView);
  float f = pow(1.0 - max(dot(N,-V),0.0), 3.0);
  gl_FragColor = vec4(uGlow*f*uGain, f*0.85);
}`;
