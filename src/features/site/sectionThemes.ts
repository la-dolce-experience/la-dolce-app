import type { SectionType } from '../../types/content';

/**
 * Cor de fundo de uma seção (sections.options.theme). Paleta curta e fechada: cada cor tem os tons de texto,
 * cartões e botões ajustados para contraste AA em Sections.module.css. "padrao" = fundo da página.
 */
export const SECTION_THEMES = [
  { value: 'padrao', label: 'Padrão (fundo da página)' },
  { value: 'creme', label: 'Creme' },
  { value: 'rosa', label: 'Rosa claro' },
  { value: 'acai', label: 'Roxo açaí (textos em branco)' },
] as const;

export type SectionTheme = (typeof SECTION_THEMES)[number]['value'];

/**
 * Tipos que aceitam cor de fundo. Ficam de fora o destaque principal (fundo próprio), a faixa de destaques
 * (já é uma faixa colorida), o formulário e o atendimento (campos e mapa pensados para o fundo claro).
 */
export const THEMED_SECTION_TYPES: SectionType[] = [
  'texto_imagem',
  'cartoes',
  'catalogo',
  'etapas',
  'galeria',
  'depoimentos',
  'faq',
];

/** Cor de fundo válida da seção, ou null quando é a padrão (ou o tipo não aceita cor). */
export function sectionTheme(type: SectionType, value: unknown): Exclude<SectionTheme, 'padrao'> | null {
  if (!THEMED_SECTION_TYPES.includes(type)) return null;
  const known = SECTION_THEMES.some((t) => t.value === value);
  return known && value !== 'padrao' ? (value as Exclude<SectionTheme, 'padrao'>) : null;
}
