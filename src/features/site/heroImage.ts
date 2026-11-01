/**
 * Enquadramento da foto do destaque principal (sections.options.imageFormat; imageFocus só é lido para
 * compatibilidade: o painel agora recorta a foto no formato, no editor de recorte).
 *
 * A foto do topo é exibida numa moldura de proporção fixa, a MESMA no celular e no computador, com
 * object-fit: cover: o que não cabe na proporção é cortado. O formato escolhe a proporção da moldura e o
 * ponto de foco escolhe que parte da foto fica visível quando ela tem outra proporção.
 */
export const HERO_FORMATS = [
  { value: 'horizontal', label: 'Horizontal 5:4 (padrão)', ratio: 5 / 4, ideal: '1600 × 1280 px' },
  { value: 'quadrada', label: 'Quadrada 1:1', ratio: 1, ideal: '1600 × 1600 px' },
  { value: 'vertical', label: 'Em pé 4:5', ratio: 4 / 5, ideal: '1280 × 1600 px' },
] as const;

export const HERO_FOCUS = [
  { value: 'centro', label: 'Centro da foto', position: '50% 50%' },
  { value: 'topo', label: 'Parte de cima', position: '50% 0%' },
  { value: 'base', label: 'Parte de baixo', position: '50% 100%' },
  { value: 'esquerda', label: 'Lado esquerdo', position: '0% 50%' },
  { value: 'direita', label: 'Lado direito', position: '100% 50%' },
] as const;

export type HeroFormat = (typeof HERO_FORMATS)[number];
export type HeroFocus = (typeof HERO_FOCUS)[number];

export function heroFormat(value: unknown): HeroFormat {
  return HERO_FORMATS.find((f) => f.value === value) ?? HERO_FORMATS[0];
}

export function heroFocus(value: unknown): HeroFocus {
  return HERO_FOCUS.find((f) => f.value === value) ?? HERO_FOCUS[0];
}

/** "16:9", "4:3", "5:4"... proporção aproximada de uma foto, para mostrar no painel. */
export function describeRatio(width: number, height: number): string {
  const known: [string, number][] = [
    ['16:9', 16 / 9],
    ['3:2', 3 / 2],
    ['4:3', 4 / 3],
    ['5:4', 5 / 4],
    ['1:1', 1],
    ['4:5', 4 / 5],
    ['3:4', 3 / 4],
    ['2:3', 2 / 3],
    ['9:16', 9 / 16],
  ];
  const ratio = width / height;
  const [label] = known.reduce((best, cur) => (Math.abs(cur[1] - ratio) < Math.abs(best[1] - ratio) ? cur : best));
  return label;
}

/**
 * Quanto da foto fica de fora na moldura do formato escolhido: o lado cortado e a fração escondida.
 * Até 4% é considerado sem corte (diferença imperceptível).
 */
export function heroCrop(
  width: number,
  height: number,
  format: HeroFormat,
): { side: 'laterais' | 'topo e base' | null; hidden: number } {
  const ratio = width / height;
  if (ratio > format.ratio) {
    const hidden = 1 - format.ratio / ratio;
    return hidden > 0.04 ? { side: 'laterais', hidden } : { side: null, hidden: 0 };
  }
  const hidden = 1 - ratio / format.ratio;
  return hidden > 0.04 ? { side: 'topo e base', hidden } : { side: null, hidden: 0 };
}
