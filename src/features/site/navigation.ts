import type { SiteContent } from '../../types/content';
import { hasContent } from './sectionHelpers';

export interface NavItem {
  href: string;
  label: string;
}

/**
 * Itens de menu: seções com nome no menu, na ordem da página, que têm conteúdo para mostrar.
 * O formulário fica de fora: ele é o botão de destaque do cabeçalho.
 */
export function buildNavItems(content: SiteContent): NavItem[] {
  return content.sections
    .filter((s) => s.navLabel.trim() && s.type !== 'formulario' && hasContent(s))
    .map((s) => ({ href: `#${s.slug}`, label: s.navLabel.trim() }));
}
