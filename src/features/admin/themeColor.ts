import { customTheme, formatRatio, isHexColor } from '../site/sectionThemes';

/** Mensagem de erro da cor personalizada, ou null se ela pode ser salva. */
export function themeColorError(theme: unknown, color: unknown): string | null {
  if (theme !== 'personalizada') return null;
  if (!isHexColor(color)) return 'Informe a cor no formato #RRGGBB (ex.: #4B1E4F).';
  const custom = customTheme(color);
  if (!custom?.ok) {
    return `Esta cor não tem contraste suficiente nem com texto branco nem com texto escuro (${formatRatio(custom?.ratio ?? 0)}; o mínimo é 4,5:1). Escolha uma cor mais clara ou mais escura.`;
  }
  return null;
}
