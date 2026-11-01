import type { SectionOptions, SectionType } from '../../types/content';

/**
 * Cor de fundo de uma seção (sections.options.theme e, na cor personalizada, sections.options.themeColor).
 * As cores da paleta têm os tons de texto, cartões e botões ajustados para contraste AA em Sections.module.css;
 * a personalizada escolhe sozinha o texto claro ou escuro pelo contraste (WCAG). "padrao" = fundo da página.
 * O banco só guarda o texto: valor desconhecido, cor inválida ou sem contraste suficiente = fundo padrão.
 */
export const SECTION_THEMES = [
  { value: 'padrao', label: 'Padrão', swatch: '#fffaf7', text: '#210513' },
  { value: 'creme', label: 'Creme', swatch: '#fff6ed', text: '#210513' },
  { value: 'rosa', label: 'Rosa claro', swatch: '#fff1f5', text: '#210513' },
  { value: 'acai', label: 'Roxo açaí', swatch: '#4b1e4f', text: '#ffffff' },
  { value: 'personalizada', label: 'Cor personalizada', swatch: '', text: '' },
] as const;

export type SectionTheme = (typeof SECTION_THEMES)[number]['value'];

/**
 * Tipos que aceitam cor de fundo. Ficam de fora o destaque principal (decoração e botão claro próprios),
 * o formulário (campos com fundo claro) e o atendimento (fundo e cartões próprios, mapa).
 */
export const THEMED_SECTION_TYPES: SectionType[] = [
  'texto_imagem',
  'cartoes',
  'catalogo',
  'destaques',
  'etapas',
  'galeria',
  'depoimentos',
  'faq',
];

/** Contraste mínimo para texto normal (WCAG 2.2, nível AA). */
export const MIN_CONTRAST = 4.5;
const DARK_TEXT = '#210513';
const LIGHT_TEXT = '#ffffff';

/** "4,48:1": arredonda para baixo, para nunca mostrar 4,5 numa cor que não chega lá. */
export function formatRatio(ratio: number): string {
  return `${(Math.floor(ratio * 100) / 100).toFixed(2).replace('.', ',')}:1`;
}

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

export interface CustomTheme {
  background: string;
  /** Cor do texto escolhida pelo contraste: branco ou o vinho quase preto da marca. */
  text: string;
  ratio: number;
  /** Atinge AA (4,5:1) com o texto escolhido. */
  ok: boolean;
}

/** Texto claro ou escuro para uma cor de fundo, o que tiver mais contraste. null se a cor for inválida. */
export function customTheme(color: unknown): CustomTheme | null {
  if (!isHexColor(color)) return null;
  const background = color.toLowerCase();
  const dark = contrastRatio(background, DARK_TEXT);
  const light = contrastRatio(background, LIGHT_TEXT);
  const text = dark >= light ? DARK_TEXT : LIGHT_TEXT;
  const ratio = Math.max(dark, light);
  return { background, text, ratio, ok: ratio >= MIN_CONTRAST };
}

/**
 * Tokens da faixa com cor personalizada. Todo texto usa a cor escolhida pelo contraste (sem tons mais
 * fracos, que poderiam cair abaixo de AA); cartões e bordas são a mesma cor clareada (texto escuro) ou
 * escurecida (texto claro), o que só aumenta o contraste. Botões têm fundo próprio e continuam legíveis.
 */
export function customThemeVars(theme: CustomTheme): Record<string, string> {
  const lightText = theme.text === LIGHT_TEXT;
  const ink = lightText ? '255, 255, 255' : '33, 5, 19';
  const card = lightText ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.6)';
  return {
    background: theme.background,
    '--color-text': theme.text,
    '--color-text-soft': theme.text,
    '--color-muted': theme.text,
    '--color-brand-deep': theme.text,
    '--color-surface': card,
    '--color-border': `rgba(${ink}, 0.2)`,
    '--color-border-strong': `rgba(${ink}, 0.5)`,
    '--color-info-bg': card,
  };
}

export type ResolvedTheme = { kind: 'creme' | 'rosa' | 'acai' } | { kind: 'personalizada'; theme: CustomTheme };

/** Cor de fundo válida da seção, ou null quando é a padrão (ou inválida, ou o tipo não aceita cor). */
export function sectionTheme(type: SectionType, options: SectionOptions): ResolvedTheme | null {
  if (!THEMED_SECTION_TYPES.includes(type)) return null;
  const value = options.theme;
  if (value === 'creme' || value === 'rosa' || value === 'acai') return { kind: value };
  if (value === 'personalizada') {
    const theme = customTheme(options.themeColor);
    return theme?.ok ? { kind: 'personalizada', theme } : null;
  }
  return null;
}
