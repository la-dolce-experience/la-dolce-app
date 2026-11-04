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

/** Lado máximo do recorte gerado: afastando muito, a moldura pode ficar bem maior que a foto. */
export const MAX_CROP_SIDE = 4096;

export interface CropPlan {
  /** Tamanho final da imagem (a moldura inteira, já reduzida se passar de MAX_CROP_SIDE). */
  width: number;
  height: number;
  /** Parte da foto que cai dentro da moldura, em pixels da original. */
  source: PixelArea;
  /** Onde essa parte é desenhada na imagem final. */
  dest: PixelArea;
}

/**
 * Plano do recorte quando a moldura pode passar das bordas da foto (zoom abaixo de 100%, "afastar"):
 * a imagem final tem o tamanho da moldura, e só a parte coberta pela foto é desenhada; o resto fica
 * com o fundo. Null quando a foto ficou totalmente fora da moldura.
 */
export function planCrop(area: PixelArea, width: number, height: number): CropPlan | null {
  const left = Math.max(0, area.x);
  const top = Math.max(0, area.y);
  const right = Math.min(width, area.x + area.width);
  const bottom = Math.min(height, area.y + area.height);
  if (right - left < 1 || bottom - top < 1) return null;
  const scale = Math.min(1, MAX_CROP_SIDE / Math.max(area.width, area.height));
  return {
    width: Math.max(1, Math.round(area.width * scale)),
    height: Math.max(1, Math.round(area.height * scale)),
    source: { x: left, y: top, width: right - left, height: bottom - top },
    dest: {
      x: Math.round((left - area.x) * scale),
      y: Math.round((top - area.y) * scale),
      width: Math.max(1, Math.round((right - left) * scale)),
      height: Math.max(1, Math.round((bottom - top) * scale)),
    },
  };
}

function toBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, 0.95));
}

/**
 * Recorta no navegador e devolve um arquivo pronto para o envio normal (processImageFile + uploadMedia),
 * que gera as versões grande e pequena. WebP em alta qualidade (PNG onde o navegador não gera WebP),
 * para manter a transparência de fotos de produto recortadas.
 *
 * A moldura pode passar das bordas da foto (zoom abaixo de 100%): a sobra fica transparente, ou com a
 * cor de `background` quando informada (ex.: branco na imagem de compartilhamento).
 */
export async function cropToFile(src: string, area: PixelArea, name: string, background?: string): Promise<File> {
  const img = await loadImage(src);
  const plan = planCrop(area, img.naturalWidth, img.naturalHeight);
  if (!plan) throw new ImageProcessingError('A foto ficou fora da moldura. Arraste-a de volta antes de aplicar.');
  const canvas = document.createElement('canvas');
  canvas.width = plan.width;
  canvas.height = plan.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ImageProcessingError('Seu navegador não conseguiu recortar a imagem.');
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, plan.width, plan.height);
  }
  ctx.imageSmoothingQuality = 'high';
  const { source: s, dest: d } = plan;
  ctx.drawImage(img, s.x, s.y, s.width, s.height, d.x, d.y, d.width, d.height);
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
