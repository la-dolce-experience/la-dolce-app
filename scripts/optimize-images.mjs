// Gera as imagens otimizadas do site a partir dos originais em ../la-dolce-data/assets.
// Uso: npm run images:optimize
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

// Originais no repositório la-dolce-data, clonado ao lado deste.
const SRC = process.env.ASSETS_DIR || '../la-dolce-data/assets';
const OUT = 'public/images';
const WIDTHS = [800, 1600];

const photos = [
  { file: 'estacao-balcao.png', name: 'estacao-balcao' },
  { file: 'copinho-la-dolce-soft.jpg', name: 'copinho-la-dolce-soft' },
  { file: 'casquinha-morango.png', name: 'casquinha-morango' },
];

// Remove o fundo rosa sólido do logotipo, mantendo o contorno branco de "adesivo".
async function transparentLogo() {
  const { data, info } = await sharp(path.join(SRC, 'logo-fundo-rosa.png'))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const [pr, pg, pb] = [data[0], data[1], data[2]]; // cor do canto = fundo
  for (let i = 0; i < data.length; i += 4) {
    const d = Math.hypot(data[i] - pr, data[i + 1] - pg, data[i + 2] - pb);
    if (d < 40) data[i + 3] = 0;
    else if (d < 90) data[i + 3] = Math.round(((d - 40) / 50) * 255);
  }
  return sharp(data, { raw: info }).trim();
}

await mkdir(OUT, { recursive: true });

for (const { file, name } of photos) {
  for (const w of WIDTHS) {
    const info = await sharp(path.join(SRC, file))
      .resize({ width: w, height: w, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path.join(OUT, `${name}-${w}.webp`));
    console.log(`${name}-${w}.webp`, info.width, 'x', info.height, Math.round(info.size / 1024), 'KB');
  }
}

const logoBuf = await (await transparentLogo()).png().toBuffer();
await sharp(logoBuf).resize({ width: 480 }).png({ compressionLevel: 9 }).toFile(path.join(OUT, 'logo.png'));
await sharp(logoBuf).resize({ width: 480 }).webp({ quality: 90 }).toFile(path.join(OUT, 'logo.webp'));

// Favicons a partir do logotipo original (fundo rosa, recortado ao centro).
const square = sharp(path.join(SRC, 'logo-fundo-rosa.png')).resize(512, 512, { fit: 'cover' });
await square.clone().resize(180).png().toFile('public/apple-touch-icon.png');
await square.clone().resize(48).png().toFile('public/favicon.png');

// Imagem de compartilhamento (Open Graph) 1200x630.
await sharp(path.join(SRC, 'estacao-balcao.png'))
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .jpeg({ quality: 82 })
  .toFile(path.join(OUT, 'og-la-dolce.jpg'));

console.log('ok');
