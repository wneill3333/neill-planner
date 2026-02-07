import sharp from 'sharp';

const source = 'F:/Users/Bill/Desktop/Convention-Magnet.jpg';

const sizes = [
  { name: 'public/icons/icon-192x192.png', size: 192 },
  { name: 'public/icons/icon-512x512.png', size: 512 },
  { name: 'public/icons/apple-touch-icon-180x180.png', size: 180 },
];

for (const { name, size } of sizes) {
  await sharp(source)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(name);
  console.log(`Created ${name} (${size}x${size})`);
}

console.log('Done!');
