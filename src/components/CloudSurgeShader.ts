import { FRAGMENT_SHADER } from './SkyShared';

// Both shaders below reuse everything in the Sky shader that comes BEFORE its `main()`:
// the precision, uniforms, constants (ZOOM, BLUR_RADIUS, FBM_STRENGTH, ...) and the noise
// helpers (noise2, fbm4, cnoise). PREFIX is that text, sliced out at runtime so it can never
// drift from Sky.tsx. DECLS adds the extra uniforms and band constants both mains need.
const cut = FRAGMENT_SHADER.indexOf('uniform vec2 u_dirv;');
if (cut < 0) throw new Error('Sky shader layout changed: could not find u_dirv');
const PREFIX = FRAGMENT_SHADER.slice(0, cut);

const DECLS = /* glsl */ `
uniform vec2 u_dirv;
uniform float u_p;
uniform vec3 u_cloud;   // colour of the fully-covered screen / the belt's solid core
uniform vec3 u_shade;   // the leading, thinner banks are tinted a little toward this colour (sky main)
uniform float u_flip;   // SURGE only: 1.0 mirrors vertically, so the mass hangs from the TOP edge

// SURGE band thresholds: where each band's coverage line starts (below the screen) and ends
// (above it). Band A leads, B follows, C trails — the offset between them gives the layered look.
const float A0 = -0.62; const float A1 = 1.70;
const float B0 = -0.77; const float B1 = 1.60;
const float C0 = -0.92; const float C1 = 1.50;
`;

// Shared head: runs the SAME domain-warp and fbm as Sky.tsx's own main(), producing `uv`
// (warped, sky-space coords), `full` (the fbm cloud field) and `time`, which both mains sample.
const WARP_HEAD = /* glsl */ `
  vec2 st = gl_FragCoord.xy/u_res - 0.5;
  st.x *= u_res.x/u_res.y;
  st = mat2(u_dirv.x, u_dirv.y, -u_dirv.y, u_dirv.x)*st;
  if (u_flip > 0.5) st.y = -st.y;
  float time = u_t*0.85;
  vec2 uv = st*(1.0/(2.0*ZOOM)) + 0.5;
  float noiseX = cnoise(vec3(uv*u_nscale + vec2(0.0, 74.8572), time*0.3));
  float noiseY = cnoise(vec3(uv*u_nscale + vec2(203.91282, 10.0), time*0.3));
  uv += vec2(noiseX*2.0, noiseY)*u_warp;
  float noiseA = cnoise(vec3(uv*18.0 + vec2(344.91282, 0.0), time*0.3))
               + cnoise(vec3(uv*39.6 + vec2(723.937, 0.0), time*0.4))*0.5;
  uv += noiseA*0.02;
  uv.y -= 0.09;
  float xf = (sin(time) + 1.0)*0.5;
  vec2 texUv = uv*GRAIN_SCALE;
  float d0 = mix(texture2D(u_noise, texUv).r - 0.5, texture2D(u_noise, vec2(texUv.x, 1.0-texUv.y)).g - 0.5, xf)*GRAIN_STRENGTH;
  texUv += vec2(63.861, 368.937);
  float d1 = mix(texture2D(u_noise, texUv).r - 0.5, texture2D(u_noise, vec2(texUv.x, 1.0-texUv.y)).g - 0.5, xf)*GRAIN_STRENGTH;
  texUv += vec2(453.163, 1649.808);
  float d3 = mix(texture2D(u_noise, texUv).r - 0.5, texture2D(u_noise, vec2(texUv.x, 1.0-texUv.y)).g - 0.5, xf)*GRAIN_STRENGTH;
  uv += d0;
  vec2 stF = uv*u_nscale;
  vec2 q = vec2(fbm4(stF*0.5 + u_wind*time));
  vec2 r = vec2(fbm4(stF + q + vec2(0.3, 9.2) + 0.15*time), fbm4(stF + q + vec2(8.3, 0.8) + 0.126*time));
  float fv = fbm4(stF + r - q);
  float full = (fv + 0.6*fv*fv + 0.7*fv + 0.5)*0.5;
  full = pow(full, 0.55)*FBM_STRENGTH;
  float blurR = BLUR_RADIUS*1.5;
`;

// ---- SURGE: a cloud mass that rises from the bottom of the screen (or, with u_flip, hangs from
// the top with its billowing edge pointing down) and finally covers the screen in solid u_cloud.
//   u_p 0..1  surge progress: 0 = fully transparent, 1 = solid u_cloud
const SURGE_MAIN = /* glsl */ `
void main(){
${WARP_HEAD}
  float e = u_p*u_p*(3.0 - 2.0*u_p); // ease in/out so the surge swells, then settles

  vec2 uvA = uv + vec2((full-0.5)*1.2) + vec2(0.0, 0.025) + d0;
  float snA = noise2(uvA*2.0 + vec2(0.0, time*0.5))*3.0;
  float covA = 1.0 - smoothstep(snA - 1.2*blurR, snA + 1.2*blurR, (uvA.y - mix(A0, A1, e))*5.0 + 0.5);

  vec2 uvB = uv + vec2((full-0.5)*0.85) + vec2(0.0, 0.025) + d1;
  float snB = noise2(uvB*4.0 + vec2(293.0, time))*2.8;
  float covB = 1.0 - smoothstep(snB - 0.9*blurR, snB + 0.9*blurR, (uvB.y - mix(B0, B1, e))*5.0 + 0.5);

  vec2 uvC = uv + vec2((full-0.5)*1.1) + d3;
  float snC = noise2(uvC*6.0 + vec2(153.0, time*1.2))*2.6;
  float covC = 1.0 - smoothstep(snC - 0.7*blurR, snC + 0.7*blurR, (uvC.y - mix(C0, C1, e))*6.0 + 0.5);

  vec3 colA = mix(u_cloud, u_shade, 0.38);
  vec3 colB = mix(u_cloud, u_shade, 0.16);
  vec3 colC = u_cloud;

  vec3 pm = colA*covA;
  pm = colB*covB + pm*(1.0 - covB);
  pm = colC*covC + pm*(1.0 - covC);
  float al = 1.0 - (1.0 - covA)*(1.0 - covB)*(1.0 - covC);

  float done = smoothstep(0.96, 1.0, u_p);
  pm = mix(pm, u_cloud, done);
  al = mix(al, 1.0, done);
  float start = smoothstep(0.0, 0.08, u_p);
  pm *= start;
  al *= start;

  gl_FragColor = vec4(pm, al);
}
`;

export const SURGE_FRAGMENT_SHADER = PREFIX + DECLS + SURGE_MAIN;

// ---- BELT: a horizontal cloud band, billowing on both its top and bottom edges, centred
// vertically in its canvas. Meant to be placed straddling the seam between two stacked
// sections (e.g. Projects -> Certifications): since the seam always falls inside the belt's
// solid core, the two sections can never show a hard line, at any scroll position.
//   u_p 0..1  swells the belt slightly thicker (a little "breathing" motion, not a coverage wipe)
const BELT_MAIN = /* glsl */ `
void main(){
${WARP_HEAD}
  float ys = gl_FragCoord.y/u_res.y;
  float h = mix(0.27, 0.30, u_p);
  float bl = 0.05;
  float dA = clamp((full - 0.5)*2.4, -1.0, 1.0)*0.075 + (noise2(uv*3.2 + vec2(11.0, time*0.5)) - 0.5)*0.05;
  float dB = clamp((full - 0.5)*2.0, -1.0, 1.0)*0.065 + (noise2(uv*4.6 + vec2(57.0, time*0.8)) - 0.5)*0.045;
  float dC = clamp((full - 0.5)*1.8, -1.0, 1.0)*0.055 + (noise2(uv*6.0 + vec2(93.0, time*1.1)) - 0.5)*0.04;

  float covA = 1.0 - smoothstep(h + 0.05 - bl, h + 0.05 + bl, abs(ys - 0.5 + dA));
  float covB = 1.0 - smoothstep(h + 0.025 - bl, h + 0.025 + bl, abs(ys - 0.5 + dB));
  float covC = 1.0 - smoothstep(h - bl, h + bl, abs(ys - 0.5 + dC));

  vec3 colA = mix(u_cloud, u_shade, 0.38);
  vec3 colB = mix(u_cloud, u_shade, 0.16);
  vec3 colC = u_cloud;

  vec3 pm = colA*covA;
  pm = colB*covB + pm*(1.0 - covB);
  pm = colC*covC + pm*(1.0 - covC);
  float al = 1.0 - (1.0 - covA)*(1.0 - covB)*(1.0 - covC);

  gl_FragColor = vec4(pm, al);
}
`;

export const BELT_FRAGMENT_SHADER = PREFIX + DECLS + BELT_MAIN;