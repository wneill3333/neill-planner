/**
 * Generate PWA icon PNGs - simple branded placeholder icons.
 * Replace with proper designed icons later.
 */
import { writeFileSync } from 'fs';
import { deflateSync } from 'zlib';

function createPNG(width, height, r, g, b) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    const table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      }
      table[n] = c;
    }
    for (let i = 0; i < buf.length; i++) {
      crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function createChunk(type, data) {
    const typeBuffer = Buffer.from(type);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const combined = Buffer.concat([typeBuffer, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(combined));
    return Buffer.concat([length, combined, crc]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const rows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 3);
    row[0] = 0; // no filter

    const cy = height / 2;
    const dy = Math.abs(y - cy) / cy;

    for (let x = 0; x < width; x++) {
      const cx = width / 2;
      const dx = Math.abs(x - cx) / cx;

      // Rounded rect boundary
      const margin = 0.06;
      const cornerR = 0.12;
      const inRect = dx < (1 - margin) && dy < (1 - margin);
      const cornerX = Math.max(0, dx - (1 - margin - cornerR));
      const cornerY = Math.max(0, dy - (1 - margin - cornerR));
      const inCorner = (cornerX * cornerX + cornerY * cornerY) > cornerR * cornerR;

      if (!inRect || inCorner) {
        // Outside rounded rect - white background
        row[1 + x * 3] = 255;
        row[1 + x * 3 + 1] = 255;
        row[1 + x * 3 + 2] = 255;
      } else {
        // Inside - draw a circle outline with checkmark impression
        const relX = (x - cx) / (width * 0.35);
        const relY = (y - cy * 0.85) / (height * 0.35);
        const dist = Math.sqrt(relX * relX + relY * relY);

        if (dist > 0.88 && dist < 1.12) {
          // White circle outline
          row[1 + x * 3] = 255;
          row[1 + x * 3 + 1] = 255;
          row[1 + x * 3 + 2] = 255;
        } else {
          // Brand blue fill
          row[1 + x * 3] = r;
          row[1 + x * 3 + 1] = g;
          row[1 + x * 3 + 2] = b;
        }
      }
    }
    rows.push(row);
  }

  const rawData = Buffer.concat(rows);
  const compressed = deflateSync(rawData);

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Brand blue #3B82F6 = rgb(59, 130, 246)
const sizes = [
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'apple-touch-icon-180x180.png', size: 180 },
];

for (const { name, size } of sizes) {
  const png = createPNG(size, size, 59, 130, 246);
  const path = `public/icons/${name}`;
  writeFileSync(path, png);
  console.log(`Created ${path} (${png.length} bytes)`);
}

console.log('Done!');
