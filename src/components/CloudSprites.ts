// Generates soft cloud sprites as PNG data-URLs (no image assets needed).
// The hero uses these as separate DOM elements so individual clouds can sit
// in front of or behind individual letters, which the shader sky can't do.

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeCloudSprites(rgb: [number, number, number], count = 4): string[] {
  const [R, G, B] = rgb;
  const sprites: string[] = [];
  for (let k = 0; k < count; k++) {
    const rnd = mulberry32(1337 + k * 97);
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 420;
    const g = canvas.getContext('2d');
    if (!g) continue;

    const puffs = 18 + Math.floor(rnd() * 6);
    for (let i = 0; i < puffs; i++) {
      const t = rnd();
      const x = 170 + t * 380;
      const bulge = Math.sin(t * Math.PI); // taller toward the middle
      const y = 270 - bulge * (50 + rnd() * 60) - rnd() * 20;
      const r = 55 + bulge * 45 * rnd() + 35 * rnd();
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `rgba(${R},${G},${B},0.78)`);
      grad.addColorStop(0.55, `rgba(${R},${G},${B},0.42)`);
      grad.addColorStop(1, `rgba(${R},${G},${B},0)`);
      g.fillStyle = grad;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    sprites.push(canvas.toDataURL('image/png'));
  }
  return sprites;
}