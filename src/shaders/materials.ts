import * as THREE from 'three';
import { COLORS } from '@/lib/constants';

/**
 * Ice-blue sunray dial. The sunburst is generated from the fragment's polar
 * angle; a soft specular highlight tracks the pointer so reflections "shift"
 * as the visitor moves, and an index ring illuminates on `uReveal`.
 */
export function createDialMaterial() {
  return new THREE.ShaderMaterial({
    transparent: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uDeep: { value: new THREE.Color(COLORS.iceDeep) },
      uBright: { value: new THREE.Color(COLORS.iceBright) },
      uReveal: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2 uPointer;
      uniform vec3 uDeep;
      uniform vec3 uBright;
      uniform float uReveal;

      void main() {
        vec2 p = vUv - 0.5;
        float r = length(p) * 2.0;
        float ang = atan(p.y, p.x);

        // Fine machined sunray finish.
        float rays = 0.5 + 0.5 * cos(ang * 240.0 + sin(uTime * 0.05));
        rays = pow(clamp(rays, 0.0, 1.0), 1.6);

        // Brightest in the mid-field, falling to centre and rim.
        float radial = smoothstep(0.0, 0.18, r) * (1.0 - smoothstep(0.86, 1.0, r));

        // Pointer-tracked specular sheen.
        vec2 hl = uPointer * 0.34;
        float spec = exp(-11.0 * length(p - hl));

        vec3 col = mix(uDeep, uBright, rays * 0.55 + radial * 0.4);
        col += spec * 0.55;

        // Applied index ring — illuminates on reveal.
        float ring = smoothstep(0.60, 0.63, r) - smoothstep(0.70, 0.73, r);
        col += ring * uReveal * 0.6;

        col *= 0.82 + 0.18 * radial;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

/**
 * Platinum dust — additive points drifting slowly upward with a gentle sway.
 * Geometry (positions / scale / speed / offset) is supplied by the component.
 */
export function createParticlesMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: 26 },
      uPixelRatio: { value: 1 },
      uAlpha: { value: 0.5 },
      uColor: { value: new THREE.Color(COLORS.platinum) },
      uRange: { value: 14 },
    },
    vertexShader: /* glsl */ `
      attribute float aScale;
      attribute float aSpeed;
      attribute float aOffset;
      uniform float uTime;
      uniform float uSize;
      uniform float uPixelRatio;
      uniform float uRange;
      varying float vFade;

      void main() {
        vec3 pos = position;
        float t = uTime * aSpeed + aOffset;
        pos.y = mod(pos.y + t, uRange) - uRange * 0.5;
        pos.x += sin(t * 0.6 + aOffset) * 0.25;
        pos.z += cos(t * 0.4 + aOffset) * 0.25;

        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * aScale * uPixelRatio * (1.0 / -mv.z);

        // Fade near the vertical extremes.
        float edge = abs(pos.y) / (uRange * 0.5);
        vFade = 1.0 - smoothstep(0.6, 1.0, edge);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform vec3 uColor;
      uniform float uAlpha;
      varying float vFade;

      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(uColor, a * uAlpha * vFade);
      }
    `,
  });
}

function drawCrown(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  const r = s * 0.16;
  const xs = [-0.72, -0.36, 0, 0.36, 0.72].map((o) => x + o * s);
  const ys = [y - s * 0.05, y - s * 0.22, y - s * 0.34, y - s * 0.22, y - s * 0.05];
  ctx.lineWidth = s * 0.1;
  xs.forEach((px, i) => {
    ctx.beginPath();
    ctx.moveTo(px, ys[i]);
    ctx.lineTo(px, y + s * 0.18);
    ctx.stroke();
  });
  xs.forEach((px, i) => {
    ctx.beginPath();
    ctx.arc(px, ys[i], r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillRect(x - s * 0.8, y + s * 0.16, s * 1.6, s * 0.18);
}

/**
 * Dial printing — coronet + ROLEX + DAY-DATE + PLATINUM + SWISS MADE drawn to a
 * transparent canvas, returned as a texture. No font files; uses system serif.
 */
export function createDialPrintTexture(): THREE.Texture | null {
  if (typeof document === 'undefined') return null;
  const size = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const cx = size / 2;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = '#eef3f8';
  ctx.strokeStyle = '#eef3f8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  drawCrown(ctx, cx, 300, 66);

  const setSpacing = (v: string) => {
    try {
      (ctx as unknown as { letterSpacing: string }).letterSpacing = v;
    } catch {
      /* not supported */
    }
  };

  setSpacing('8px');
  ctx.font = '700 90px Georgia, "Times New Roman", serif';
  ctx.fillText('ROLEX', cx, 384);

  setSpacing('5px');
  ctx.font = '600 34px Georgia, serif';
  ctx.fillText('DAY-DATE', cx, 648);
  ctx.font = '500 27px Georgia, serif';
  ctx.fillText('PLATINUM', cx, 690);

  setSpacing('7px');
  ctx.font = '600 23px Georgia, serif';
  ctx.fillText('SWISS  MADE', cx, 908);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/** Shared physically-based platinum. Tuned for the in-scene studio env. */
export function platinumMaterial(opts: Partial<{ color: string; rough: number; clearcoat: number }> = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(opts.color ?? COLORS.platinum),
    metalness: 1.0,
    roughness: opts.rough ?? 0.18,
    clearcoat: opts.clearcoat ?? 0.6,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.35,
  });
}
