import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../public/icons");
fs.mkdirSync(outDir, { recursive: true });

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 4);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    makeChunk("IHDR", ihdr),
    makeChunk("IDAT", compressed),
    makeChunk("IEND", Buffer.alloc(0)),
  ]);
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function sdfRoundRect(px, py, cx, cy, hw, hh, r) {
  const qx = Math.abs(px - cx) - hw + r;
  const qy = Math.abs(py - cy) - hh + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

function sdfCircle(px, py, cx, cy, r) {
  return Math.hypot(px - cx, py - cy) - r;
}

function renderIcon(size, { maskable = false } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  const scale = maskable ? 0.78 : 0.92;
  const aa = 1.6 / size;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size;
      const v = (y + 0.5) / size;

      // Deep Scandinavian zenith sky gradient
      const grad = Math.min(1, Math.max(0, u * 0.45 + v * 0.75));
      let r = mix(7, 23, grad);
      let g = mix(21, 68, grad);
      let b = mix(43, 122, grad);

      // Transform into centered glyph coordinates
      const gx = (u - 0.5) / scale + 0.5;
      const gy = (v - 0.5) / scale + 0.5;

      // Warm golden atmospheric bloom behind sun
      const sunX = 0.62;
      const sunY = 0.36;
      const sunDist = Math.hypot(gx - sunX, gy - sunY);
      const glow = Math.exp(-sunDist * sunDist * 11) * 0.55;
      r = mix(r, 253, glow);
      g = mix(g, 204, glow);
      b = mix(b, 60, glow);

      // Sun disc
      const dSun = sdfCircle(gx, gy, sunX, sunY, 0.165);
      const sunAlpha = 1 - smoothstep(-aa, aa, dSun);
      if (sunAlpha > 0) {
        const sg = Math.min(1, Math.max(0, (gy - (sunY - 0.165)) / 0.33));
        const sr = mix(254, 245, sg);
        const sgr = mix(240, 158, sg);
        const sb = mix(138, 11, sg);
        r = mix(r, sr, sunAlpha);
        g = mix(g, sgr, sunAlpha);
        b = mix(b, sb, sunAlpha);
      }

      // Sculpted cloud SDF (union of circles + rounded base)
      const c1 = sdfCircle(gx, gy, 0.33, 0.57, 0.115);
      const c2 = sdfCircle(gx, gy, 0.49, 0.48, 0.165);
      const c3 = sdfCircle(gx, gy, 0.66, 0.56, 0.12);
      const cBase = sdfRoundRect(gx, gy, 0.495, 0.615, 0.255, 0.085, 0.082);
      const dCloud = Math.min(c1, c2, c3, cBase);

      // Subtle cloud drop shadow
      const dShadow = Math.min(
        sdfCircle(gx, gy - 0.03, 0.33, 0.57, 0.12),
        sdfCircle(gx, gy - 0.03, 0.49, 0.48, 0.17),
        sdfCircle(gx, gy - 0.03, 0.66, 0.56, 0.125),
        sdfRoundRect(gx, gy - 0.03, 0.495, 0.615, 0.26, 0.09, 0.085)
      );
      const shadowAlpha = (1 - smoothstep(-0.04, 0.06, dShadow)) * 0.28;
      r = mix(r, 4, shadowAlpha);
      g = mix(g, 10, shadowAlpha);
      b = mix(b, 24, shadowAlpha);

      const cloudAlpha = 1 - smoothstep(-aa, aa, dCloud);
      if (cloudAlpha > 0) {
        const cg = Math.min(1, Math.max(0, (gy - 0.33) / 0.38));
        const cr = mix(255, 203, cg);
        const cgr = mix(255, 216, cg);
        const cb = mix(255, 232, cg);
        r = mix(r, cr, cloudAlpha);
        g = mix(g, cgr, cloudAlpha);
        b = mix(b, cb, cloudAlpha);
      }

      // Outer rounded mask for non-maskable icons? Keep full-bleed square for iOS/Android crisp squircle clipping!
      const idx = (y * size + x) * 4;
      rgba[idx] = Math.round(Math.max(0, Math.min(255, r)));
      rgba[idx + 1] = Math.round(Math.max(0, Math.min(255, g)));
      rgba[idx + 2] = Math.round(Math.max(0, Math.min(255, b)));
      rgba[idx + 3] = 255;
    }
  }

  return encodePNG(size, size, rgba);
}

const specs = [
  { name: "icon-192.png", size: 192, maskable: false },
  { name: "icon-512.png", size: 512, maskable: false },
  { name: "icon-maskable-512.png", size: 512, maskable: true },
  { name: "apple-touch-icon.png", size: 180, maskable: false },
];

for (const spec of specs) {
  const png = renderIcon(spec.size, { maskable: spec.maskable });
  fs.writeFileSync(path.join(outDir, spec.name), png);
  console.log(`Generated ${spec.name} (${spec.size}x${spec.size})`);
}
