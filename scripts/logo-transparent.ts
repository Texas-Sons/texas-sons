/**
 * Makes a logo's background transparent — `npm run logo:transparent <in> [out]`.
 *
 * Client logos almost always arrive as a JPEG or a flat PNG on white, which
 * renders as a white box on a dark theme. This strips the background so the mark
 * sits on whatever colour the site uses.
 *
 * Uses a flood fill from the edges rather than "make every light pixel
 * transparent". The naive version (remove_bg.cjs) deletes any light neutral
 * pixel anywhere in the image, which would have erased the thin silver frame in
 * the Opalescent logo along with the background. Only background *connected to
 * the border* should go; anything enclosed by the artwork stays.
 */

import { Jimp } from 'jimp';
import path from 'path';

const [, , inputArg, outputArg] = process.argv;

if (!inputArg) {
  console.error('Usage: npm run logo:transparent <input.png> [output.png]');
  process.exit(1);
}

const input = path.resolve(inputArg);
const output = path.resolve(outputArg || inputArg.replace(/\.(png|jpg|jpeg)$/i, '-transparent.png'));

/** How far from pure white still counts as background. */
const TOLERANCE = 26;

const image = await Jimp.read(input);
const { width, height, data } = image.bitmap;

console.log(`read ${path.basename(input)} — ${width}x${height}`);

function isBackgroundish(idx: number): boolean {
  const r = data[idx], g = data[idx + 1], b = data[idx + 2];
  // Near-white and near-neutral. A coloured brushstroke fails the neutral test
  // even when it is pale, so pastel artwork survives.
  const light = r > 255 - TOLERANCE && g > 255 - TOLERANCE && b > 255 - TOLERANCE;
  const neutral = Math.abs(r - g) < 12 && Math.abs(g - b) < 12 && Math.abs(r - b) < 12;
  return light && neutral;
}

// Flood fill inward from every border pixel.
const visited = new Uint8Array(width * height);
const queue: number[] = [];

for (let x = 0; x < width; x++) {
  queue.push(x, 0, x, height - 1);
}
for (let y = 0; y < height; y++) {
  queue.push(0, y, width - 1, y);
}

let cleared = 0;
while (queue.length) {
  const y = queue.pop()!;
  const x = queue.pop()!;
  if (x < 0 || y < 0 || x >= width || y >= height) continue;

  const p = y * width + x;
  if (visited[p]) continue;
  visited[p] = 1;

  const idx = p * 4;
  if (!isBackgroundish(idx)) continue;

  data[idx + 3] = 0;
  cleared++;

  queue.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
}

const total = width * height;
console.log(`cleared ${cleared.toLocaleString()} background pixels (${((cleared / total) * 100).toFixed(1)}% of the image)`);

// A logo that is almost entirely background, or barely touched, usually means
// the tolerance is wrong for this file — say so rather than writing something odd.
const pct = (cleared / total) * 100;
if (pct > 95) console.warn('WARNING: nearly the whole image was cleared. Is this the right file?');
if (pct < 5) console.warn('WARNING: almost nothing was cleared. The background may not be white — try a different source.');

await image.write(output as `${string}.${string}`);
console.log(`wrote ${path.relative(process.cwd(), output)}`);
