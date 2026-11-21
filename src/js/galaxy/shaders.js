/* ─────────────────────────────────────────────────────────────
   Galaxy dust
   Spiral motion + per-star size/twinkle. Ported from the reference
   galaxy shaders and extended with distance fades so a camera can
   fly *through* the disc without the fill-rate exploding.
   ───────────────────────────────────────────────────────────── */

export const galaxyVertexShader = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform float uSpin;
uniform float uDrift;
uniform float uBrightness;

attribute float aScale;
attribute float aPhase;
attribute vec3 aRandomness;

varying vec3 vColor;
varying float vTwinkle;
varying float vFade;

void main() {
  vec3 p = position;

  // Orbital motion: inner stars rotate faster than outer stars.
  float distanceToCenter = length(p.xz);
  float angle = atan(p.x, p.z);
  angle += (1.0 / (distanceToCenter + 0.6)) * uTime * uSpin;
  p.x = cos(angle) * distanceToCenter;
  p.z = sin(angle) * distanceToCenter;

  // A barely-there vertical breath keeps the disc from feeling frozen.
  p.y += sin(uTime * 0.22 + aPhase * 6.2831 + distanceToCenter * 0.3) * uDrift * 0.12;

  p += aRandomness;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float viewDist = max(-mv.z, 0.1);
  float nearFade = smoothstep(1.1, 4.2, viewDist);
  float farFade = 1.0 - smoothstep(52.0, 92.0, viewDist);

  float twinkle = 0.78 + 0.22 * sin(uTime * 1.35 + aPhase * 6.2831);

  vTwinkle = twinkle;
  vFade = nearFade * farFade * uBrightness;
  vColor = color;

  gl_PointSize = uSize * uPixelRatio * aScale * twinkle * (1.0 / viewDist);
  gl_PointSize *= nearFade;
  gl_PointSize = clamp(gl_PointSize, 0.0, 24.0);
}
`

export const galaxyFragmentShader = /* glsl */ `
varying vec3 vColor;
varying float vTwinkle;
varying float vFade;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;

  float halo = smoothstep(0.5, 0.02, d);
  float core = pow(halo, 7.0);

  float alpha = (halo * 0.24 + core * 0.55) * vFade;
  if (alpha < 0.003) discard;

  vec3 col = vColor * (0.5 + core * 1.05) * vTwinkle;
  gl_FragColor = vec4(col, alpha);
}
`

/* ─────────────────────────────────────────────────────────────
   Chapter nodes
   One draw call for all six markers. A core, a soft halo, a thin
   orbital ring and a four-point flare; active/hover states are
   passed as uniforms so no geometry has to be rebuilt.
   ───────────────────────────────────────────────────────────── */

export const nodeVertexShader = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
uniform float uPointSize;
uniform float uActive;
uniform float uHover;

attribute float aIndex;
attribute float aPhase;
attribute float aSize;

varying float vHighlight;
varying float vPulse;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;

  float isActive = 1.0 - step(0.5, abs(aIndex - uActive));
  float isHover = 1.0 - step(0.5, abs(aIndex - uHover));
  vHighlight = max(isActive, isHover * 0.75);

  vPulse = 0.5 + 0.5 * sin(uTime * 1.9 + aPhase * 6.2831);

  float viewDist = max(-mv.z, 0.1);
  float distanceScale = clamp(12.0 / viewDist, 0.72, 1.65);
  float scale = aSize * (1.0 + vHighlight * 0.55 + vPulse * 0.1);

  gl_PointSize = uPointSize * uPixelRatio * scale * distanceScale;
  gl_PointSize = clamp(gl_PointSize, 6.0 * uPixelRatio, 46.0 * uPixelRatio);
}
`

export const nodeFragmentShader = /* glsl */ `
varying float vHighlight;
varying float vPulse;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;

  float core = smoothstep(0.15, 0.0, d);
  float glow = pow(smoothstep(0.5, 0.0, d), 2.4);

  float ring = smoothstep(0.47, 0.41, d) * (1.0 - smoothstep(0.41, 0.35, d));

  float flareX = max(0.0, 1.0 - abs(uv.x) * 30.0) * max(0.0, 1.0 - abs(uv.y) * 3.2);
  float flareY = max(0.0, 1.0 - abs(uv.y) * 30.0) * max(0.0, 1.0 - abs(uv.x) * 3.2);
  float flare = flareX + flareY;

  float pulse = mix(0.42, 1.0, vPulse);

  vec3 base = vec3(0.89, 0.70, 0.39);
  vec3 hot = vec3(1.0, 0.94, 0.80);
  vec3 col = mix(base, hot, core);
  col *= 0.9 + vHighlight * 1.15;

  float alpha = glow * 0.45 * pulse;
  alpha += core * 0.95;
  alpha += ring * (0.1 + vHighlight * 0.6) * pulse;
  alpha += flare * (0.04 + vHighlight * 0.42);

  gl_FragColor = vec4(col, alpha);
}
`
