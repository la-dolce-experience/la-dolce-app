import type { ProcessedImage } from '../services/adminService';
import { HEIC_EXTENSIONS, HEIC_MIME_TYPES, looksLikeHeic } from './heic';

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
/** Valor do atributo `accept` do campo de arquivo: inclui HEIC, convertido para JPEG antes do envio. */
export const ACCEPT_ATTRIBUTE = [...ACCEPTED_IMAGE_TYPES, ...HEIC_MIME_TYPES, ...HEIC_EXTENSIONS].join(',');
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB (antes da otimização)
export const MIN_IMAGE_SIDE = 400;
const LARGE_SIDE = 1600;
const SMALL_SIDE = 800;

/** Erro com mensagem pronta para exibir ao usuário. */
export class ImageProcessingError extends Error {}

/** Validação feita antes de decodificar o arquivo. Retorna mensagem de erro ou null. */
export function validateImageFile(file: Pick<File, 'type' | 'size' | 'name'>): string | null {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type) && !looksLikeHeic(file)) {
    return 'Formato não aceito. Envie uma foto JPG, PNG, WebP ou HEIC (iPhone).';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `A imagem tem ${(file.size / 1024 / 1024).toFixed(1)} MB. O limite é 10 MB.`;
  }
  if (file.size === 0) return 'O arquivo está vazio.';
  return null;
}

/** Dimensões para caber em uma caixa quadrada de `max` px, sem ampliar. */
export function fitInside(width: number, height: number, max: number) {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new ImageProcessingError('Falha ao converter a imagem.'))),
      type,
      quality,
    ),
  );
}

async function render(bitmap: ImageBitmap, max: number, type: string) {
  const size = fitInside(bitmap.width, bitmap.height, max);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ImageProcessingError('Seu navegador não conseguiu processar a imagem.');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, size.width, size.height);
  const blob = await canvasToBlob(canvas, type, 0.82);
  return { blob, ...size };
}

/**
 * Redimensiona e converte no navegador antes do envio: duas variantes
 * (1600 px e 800 px) em WebP — ou JPEG em navegadores que não geram WebP.
 */
export async function processImageFile(file: File): Promise<ProcessedImage> {
  const error = validateImageFile(file);
  if (error) throw new ImageProcessingError(error);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new ImageProcessingError('Não foi possível ler esta imagem. O arquivo pode estar corrompido.');
  }

  try {
    if (Math.max(bitmap.width, bitmap.height) < MIN_IMAGE_SIDE) {
      throw new ImageProcessingError(
        `Imagem pequena demais (${bitmap.width}×${bitmap.height}). Use ao menos ${MIN_IMAGE_SIDE} px no maior lado.`,
      );
    }
    let large = await render(bitmap, LARGE_SIDE, 'image/webp');
    let mimeType: ProcessedImage['mimeType'] = 'image/webp';
    if (large.blob.type !== 'image/webp') {
      mimeType = 'image/jpeg';
      large = await render(bitmap, LARGE_SIDE, mimeType);
    }
    const small = await render(bitmap, SMALL_SIDE, mimeType);
    return {
      large: large.blob,
      small: small.blob,
      width: large.width,
      height: large.height,
      smallWidth: small.width,
      smallHeight: small.height,
      mimeType,
    };
  } finally {
    bitmap.close();
  }
}
