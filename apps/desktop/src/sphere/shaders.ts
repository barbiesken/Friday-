/**
 * The Sphere — a layered, transparent glass orb.
 *
 *   atmosphere (additive halo)  ── outermost soft glow
 *   glass shell (fresnel glass) ── transparent crystal, iridescent rim
 *   particle field (GPU points) ── energy motes, faster near the core
 *   energy soul  (emissive)     ── the wispy plasma heart
 *
 * Everything is driven by uniforms the React layer lerps toward state targets.
 */

const SNOISE = /* glsl */ `
vec3 mod289(vec3 x){return x - floor(x * (1.0/289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0/289.0)) * 289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
float fbm(vec3 p){
  float a = 0.5, f = 1.0, s = 0.0;
  for(int i=0;i<5;i++){ s += a*snoise(p*f); f*=2.03; a*=0.5; }
  return s;
}
vec3 iridescence(float t){
  return 0.55 + 0.45*cos(6.28318*(vec3(0.0,0.33,0.66)+t));
}
`;

/* ----------------------------- energy soul ----------------------------- */
export const coreVertex = /* glsl */ `
uniform float uTime, uDisplace, uBreathe, uStorm, uAudio;
varying vec3 vNormal; varying vec3 vView; varying vec3 vPos; varying float vN;
${SNOISE}
void main(){
  vec3 p = position; float t = uTime;
  float n = snoise(normal*1.7 + vec3(0.0,0.0,t*0.25))*0.6 + snoise(normal*3.6+vec3(t*0.2))*0.4;
  vN = n;
  float storm = snoise(normal*5.0 + vec3(t*1.0)) * uStorm;
  float disp = (uDisplace + uBreathe)*n + storm*0.12 + uAudio*0.05;
  p += normal * disp;
  vNormal = normalize(mat3(modelMatrix)*normal);
  vec4 w = modelMatrix*vec4(p,1.0);
  vView = normalize(cameraPosition - w.xyz);
  vPos = p;
  gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0);
}`;

export const coreFragment = /* glsl */ `
precision highp float;
uniform float uTime, uActivity, uStorm, uAlert;
uniform vec3 uCore, uGlow;
varying vec3 vNormal; varying vec3 vView; varying vec3 vPos; varying float vN;
${SNOISE}
void main(){
  vec3 N = normalize(vNormal); vec3 V = normalize(vView);
  float fres = pow(1.0 - max(dot(N,V),0.0), 2.0);
  float flow = fbm(vPos*2.3 + vec3(0.0,uTime*0.16,0.0))*0.5+0.5;
  float sf = snoise(vPos*9.0 + vec3(uTime*0.05));
  float stars = smoothstep(0.84,0.93,sf)*(0.5+0.5*sin(uTime*3.0+vN*10.0));
  float storm = fbm(vPos*4.0+vec3(uTime*0.6))*uStorm;
  vec3 col = mix(uCore*0.18, uCore, flow);
  col += uGlow*stars*1.8;
  col += uCore*storm*0.9;
  col += uGlow*fres*(0.8+uActivity*1.4);
  vec3 alertC = vec3(1.0,0.22,0.30);
  col = mix(col, alertC*(0.7+0.5*sin(uTime*7.5)), uAlert);
  // soft-edged: fade alpha at silhouette so the soul reads as wispy energy
  float a = mix(0.92, 0.35, fres);
  gl_FragColor = vec4(col, a);
}`;

/* ------------------------------ glass shell ----------------------------- */
export const shellVertex = /* glsl */ `
uniform float uTime, uWobble, uBreathe;
varying vec3 vNormal; varying vec3 vView; varying vec3 vPos;
${SNOISE}
void main(){
  vec3 p = position; float t = uTime;
  float n = snoise(normal*2.0 + vec3(t*0.12));
  p += normal * (n * uWobble + uBreathe*0.4);
  vNormal = normalize(mat3(modelMatrix)*normal);
  vec4 w = modelMatrix*vec4(p,1.0);
  vView = normalize(cameraPosition - w.xyz);
  vPos = normal;
  gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0);
}`;

export const shellFragment = /* glsl */ `
precision highp float;
uniform float uTime, uFresnelPow, uRimGain, uRimAlpha, uBodyAlpha, uHue;
uniform vec3 uGlow, uCore;
varying vec3 vNormal; varying vec3 vView; varying vec3 vPos;
${SNOISE}
void main(){
  vec3 N = normalize(vNormal); vec3 V = normalize(vView);
  float f = pow(1.0 - max(dot(N,V),0.0), uFresnelPow);
  // thin-film iridescence across the rim
  vec3 irid = iridescence(f*1.1 + uHue + uTime*0.03);
  vec3 rim = mix(uGlow, irid, 0.5) * f * uRimGain;
  // faint internal energy veins
  float veins = fbm(vPos*4.0 + vec3(uTime*0.1)) * 0.5 + 0.5;
  vec3 body = uCore * 0.06 * veins;
  // a crisp specular glint where the highlight sits
  float glint = pow(max(dot(N, normalize(vec3(0.4,0.7,0.6))),0.0), 24.0);
  rim += vec3(1.0) * glint * 0.6;
  float alpha = clamp(f*f*uRimAlpha + uBodyAlpha + glint*0.4, 0.0, 1.0);
  gl_FragColor = vec4(rim + body, alpha);
}`;

/* ------------------------------ atmosphere ------------------------------ */
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
  vec3 N = normalize(vNormal); vec3 V = normalize(vView);
  // backside sphere → glow strongest at the silhouette
  float f = pow(1.0 - max(dot(N,-V),0.0), 3.2);
  gl_FragColor = vec4(uGlow * f * uGain, f * 0.9);
}`;

/* ------------------------------ particles ------------------------------- */
export const particleVertex = /* glsl */ `
attribute float aSeed; attribute float aRadius;
uniform float uTime, uStorm, uAudio, uSize;
varying float vTw;
void main(){
  float speed = mix(1.7, 0.45, aRadius);      // closer to core = faster
  float ang = uTime*speed + aSeed*6.28318;
  vec3 p = position;
  float c = cos(ang), s = sin(ang);
  vec3 q = vec3(p.x*c - p.z*s, p.y, p.x*s + p.z*c);
  q += normalize(p + 1e-4) * uStorm * (0.18 + 0.32*sin(uTime*3.0 + aSeed*10.0));
  vec4 mv = modelViewMatrix * vec4(q, 1.0);
  gl_Position = projectionMatrix * mv;
  vTw = 0.5 + 0.5*sin(uTime*3.0 + aSeed*20.0);
  gl_PointSize = uSize * (0.5 + aRadius) * (0.7 + uAudio*1.6) * (260.0 / -mv.z);
}`;

export const particleFragment = /* glsl */ `
precision highp float;
uniform vec3 uColor;
varying float vTw;
void main(){
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(uColor * (1.0 + vTw*0.8), a * (0.35 + 0.65*vTw));
}`;
