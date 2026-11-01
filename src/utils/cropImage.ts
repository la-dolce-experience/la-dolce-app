import { ImageProcessingError } from './imageProcessing';

/** Área em pixels da imagem original (a mesma convenção do react-easy-crop). */
export interface PixelArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Carrega a imagem pedindo CORS: sem isso o canvas fica "contaminado" e não exporta o recorte. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new ImageProcessingError('Não foi possível abrir a imagem para recortar.'));
    img.src = src;
  });
}

/** "Foto do balcão.jpg" -> "Foto do balcão (recorte).webp" (nome mostrado na biblioteca). */
export function cropFileName(original: string, type: string): string {
  const base = (original || 'imagem').replace(/\.[a-z0-9]+$/i, '').replace(/ \(recorte\)$/, '');
  return `${base} (recorte).${type === 'image/png' ? 'png' : 'webp'}`;
}

/** Área inteira dentro da imagem, com pelo menos 1 px. */
export function clampArea(area: PixelArea, width: number, height: number): PixelArea {
  const x = Math.min(Math.max(0, Math.round(area.x)), width - 1);
  const y = Math.min(Math.max(0, Math.round(area.y)), height - 1);
  return {
    x,
    y,
    width: Math.max(1, Math.min(Math.round(area.width), width - x)),
    height: Math.max(1, Math.min(Math.round(area.height), height - y)),
  };
}

function toBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, 0.95));
}

/**
 * Recorta no navegador e devolve um arquivo pronto para o envio normal (processImageFile + uploadMedia),
 * que gera as versões grande e pequena. WebP em alta qualidade (PNG onde o navegador não gera WebP),
 * para manter a transparência de fotos de produto recortadas.
 */
export async function cropToFile(src: string, area: PixelArea, name: string): Promise<File> {
  const img = await loadImage(src);
  const box = clampArea(area, img.naturalWidth, img.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = box.width;
  canvas.height = box.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ImageProcessingError('Seu navegador não conseguiu recortar a imagem.');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, box.x, box.y, box.width, box.height, 0, 0, box.width, box.height);
  let blob: Blob | null;
  try {
    blob = await toBlob(canvas, 'image/webp');
    if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/png');
  } catch {
    throw new ImageProcessingError('Não foi possível recortar esta imagem (o servidor não liberou o acesso).');
  }
  if (!blob) throw new ImageProcessingError('Falha ao gerar o recorte.');
  return new File([blob], cropFileName(name, blob.type), { type: blob.type });
}
