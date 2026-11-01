import { HERO_FORMATS } from '../site/heroImage';

/**
 * Proporção da moldura do editor de recorte. A primeira opção de cada campo é a do lugar onde a foto
 * aparece no site (medida no CSS de Sections.module.css); "Livre" mantém a proporção que a pessoa quiser.
 */
export interface CropPreset {
  label: string;
  /** Largura ÷ altura. null = livre (a moldura começa com a proporção da foto). */
  aspect: number | null;
  /** Valor da opção da seção ligado a esta proporção (ex.: formato da foto do topo). */
  value?: string;
}

export const FREE: CropPreset = { label: 'Livre', aspect: null };
export const SQUARE: CropPreset = { label: 'Quadrada 1:1', aspect: 1 };
const LANDSCAPE_4_3: CropPreset = { label: 'Deitada 4:3', aspect: 4 / 3 };

/** Foto do topo: os três formatos do destaque, começando pelo escolhido. */
export function heroCropPresets(format: unknown): CropPreset[] {
  const presets = HERO_FORMATS.map((f) => ({
    label: f.label,
    aspect: f.ratio,
    value: f.value,
  }));
  const current = presets.findIndex((p) => p.value === format);
  return current > 0 ? [presets[current], ...presets.filter((_, i) => i !== current)] : presets;
}

/**
 * Foto de "Texto com imagem" e do carrossel: moldura de altura fixa (320 a 560 px) na largura da coluna,
 * quase quadrada no computador e no celular. Com "Mostrar a foto inteira", qualquer proporção serve.
 */
export function splitPhotoPresets(fit: unknown): CropPreset[] {
  const square = { ...SQUARE, label: 'Quadrada 1:1 (como aparece no site)' };
  return fit === 'inteira' ? [{ ...FREE, label: 'Livre (a foto aparece inteira)' }, square] : [square, FREE];
}

/** Cartões do catálogo: quadrado, com a foto inteira dentro. */
export const CATALOG_ITEM_PRESETS: CropPreset[] = [{ ...SQUARE, label: 'Quadrada 1:1 (como aparece no site)' }, FREE];

/** Galeria: a primeira foto em 4:3 no celular, as outras quadradas. */
export const GALLERY_PRESETS: CropPreset[] = [LANDSCAPE_4_3, SQUARE, FREE];

/** Foto de perfil dos depoimentos: círculo. */
export const AVATAR_PRESETS: CropPreset[] = [{ ...SQUARE, label: 'Quadrada 1:1 (aparece em círculo)' }];

/** Fotos do evento nos depoimentos: miniaturas quadradas, inteiras em tela cheia. */
export const EVENT_PHOTO_PRESETS: CropPreset[] = [FREE, SQUARE];

/** Imagem de compartilhamento (WhatsApp, redes sociais): 1200 × 630 px. */
export const OG_PRESETS: CropPreset[] = [{ label: '1200 × 630 (compartilhamento)', aspect: 1200 / 630 }];

export const FREE_PRESETS: CropPreset[] = [FREE];
