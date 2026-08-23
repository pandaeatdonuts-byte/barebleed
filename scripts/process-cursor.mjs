import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const input = resolve(projectRoot, "heartagram-source.png");
const output = resolve(projectRoot, "cursor.png");
const size = 24;

const { data, info } = await sharp(input)
  .ensureAlpha()
  .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .raw()
  .toBuffer({ resolveWithObject: true });

const pixels = Buffer.from(data);

for (let index = 0; index < pixels.length; index += 4) {
  const luminance = Math.max(pixels[index], pixels[index + 1], pixels[index + 2]);

  if (luminance < 24) {
    pixels[index + 3] = 0;
    continue;
  }

  pixels[index] = 220;
  pixels[index + 1] = 18;
  pixels[index + 2] = 38;
  pixels[index + 3] = Math.min(255, Math.round((luminance / 255) * 255));
}

const icon = await sharp(pixels, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .png()
  .toBuffer();

const glow = await sharp(icon).blur(1.8).modulate({ brightness: 1.3 }).toBuffer();

const final = await sharp({
  create: {
    width: size,
    height: size,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([
    { input: glow, blend: "screen" },
    { input: icon },
  ])
  .png()
  .toBuffer();

writeFileSync(output, final);
console.log(`Wrote ${output}`);
