import fs from "fs";
import { PNG } from "pngjs";

const sourcePath = "/tmp/file_attachments/file_00000000fcf48243b70640c4ac36cbd7.png";

console.log("Reading source image asynchronously from:", sourcePath);
const fileBuffer = fs.readFileSync(sourcePath);

// Function to parse the PNG asynchronously to avoid issues with extra chunk data at the end of stream
function parsePngAsync(buffer: Buffer): Promise<PNG> {
  return new Promise((resolve, reject) => {
    new PNG().parse(buffer, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

async function run() {
  const srcPng = await parsePngAsync(fileBuffer);
  console.log(`Source image dimensions: ${srcPng.width}x${srcPng.height}`);

  // Step 1: Center crop to 1:1 square
  const size = Math.min(srcPng.width, srcPng.height);
  const startX = Math.floor((srcPng.width - size) / 2);
  const startY = Math.floor((srcPng.height - size) / 2);

  console.log(`Cropping area: StartX=${startX}, StartY=${startY}, Size=${size}x${size}`);

  // Function to resize the cropped area to target dimensions using bilinear interpolation
  function resizeImage(targetSize: number): Buffer {
    const dstPng = new PNG({ width: targetSize, height: targetSize });

    for (let ty = 0; ty < targetSize; ty++) {
      for (let tx = 0; tx < targetSize; tx++) {
        // Map target (tx, ty) to cropped source coordinate (sx, sy)
        const sx = (tx + 0.5) * (size / targetSize) - 0.5;
        const sy = (ty + 0.5) * (size / targetSize) - 0.5;

        const x0 = Math.max(0, Math.min(size - 1, Math.floor(sx)));
        const x1 = Math.max(0, Math.min(size - 1, x0 + 1));
        const y0 = Math.max(0, Math.min(size - 1, Math.floor(sy)));
        const y1 = Math.max(0, Math.min(size - 1, y0 + 1));

        const dx = sx - Math.floor(sx);
        const dy = sy - Math.floor(sy);

        const idx00 = ((startY + y0) * srcPng.width + (startX + x0)) * 4;
        const idx10 = ((startY + y0) * srcPng.width + (startX + x1)) * 4;
        const idx01 = ((startY + y1) * srcPng.width + (startX + x0)) * 4;
        const idx11 = ((startY + y1) * srcPng.width + (startX + x1)) * 4;

        const r =
          srcPng.data[idx00] * (1 - dx) * (1 - dy) +
          srcPng.data[idx10] * dx * (1 - dy) +
          srcPng.data[idx01] * (1 - dx) * dy +
          srcPng.data[idx11] * dx * dy;

        const g =
          srcPng.data[idx00 + 1] * (1 - dx) * (1 - dy) +
          srcPng.data[idx10 + 1] * dx * (1 - dy) +
          srcPng.data[idx01 + 1] * (1 - dx) * dy +
          srcPng.data[idx11 + 1] * dx * dy;

        const b =
          srcPng.data[idx00 + 2] * (1 - dx) * (1 - dy) +
          srcPng.data[idx10 + 2] * dx * (1 - dy) +
          srcPng.data[idx01 + 2] * (1 - dx) * dy +
          srcPng.data[idx11 + 2] * dx * dy;

        const a =
          srcPng.data[idx00 + 3] * (1 - dx) * (1 - dy) +
          srcPng.data[idx10 + 3] * dx * (1 - dy) * (1 - dy) + // keep standard scale
          srcPng.data[idx01 + 3] * (1 - dx) * dy +
          srcPng.data[idx11 + 3] * dx * dy;

        const dstIdx = (ty * targetSize + tx) * 4;
        dstPng.data[dstIdx] = Math.max(0, Math.min(255, Math.round(r)));
        dstPng.data[dstIdx + 1] = Math.max(0, Math.min(255, Math.round(g)));
        dstPng.data[dstIdx + 2] = Math.max(0, Math.min(255, Math.round(b)));
        dstPng.data[dstIdx + 3] = Math.max(0, Math.min(255, Math.round(a)));
      }
    }

    return PNG.sync.write(dstPng);
  }

  // Generate all target sizes
  const targets = [
    { size: 512, filename: "public/icon-512.png" },
    { size: 512, filename: "public/icon-512-maskable.png" },
    { size: 192, filename: "public/icon-192.png" },
    { size: 180, filename: "public/apple-touch-icon.png" },
    { size: 32, filename: "public/favicon-32.png" },
  ];

  for (const target of targets) {
    console.log(`Generating ${target.filename} (${target.size}x${target.size})...`);
    const buffer = resizeImage(target.size);
    fs.writeFileSync(target.filename, buffer);
    console.log(`Saved ${target.filename}`);
  }

  console.log("All icons generated successfully!");
}

run().catch((err) => {
  console.error("Error during icon generation:", err);
});
