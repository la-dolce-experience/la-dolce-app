import type { SiteContent } from '../../types/content';

export interface NavItem {
  href: string;
  label: string;
}

/** Itens de menu apenas para seções que estão visíveis e têm conteúdo. */
export function buildNavItems(content: SiteContent): NavItem[] {
  const s = content.sections;
  const items: (NavItem | false)[] = [
    s.experience.visible && { href: '#experiencia', label: 'Experiência' },
    s.events.visible && content.eventTypes.length > 0 && { href: '#eventos', label: 'Eventos' },
    s.gallery.visible && content.gallery.length > 0 && { href: '#galeria', label: 'Galeria' },
    s.location.visible && { href: '#atendimento', label: 'Atendimento' },
    s.faq.visible && content.faqs.length > 0 && { href: '#duvidas', label: 'Dúvidas' },
  ];
  return items.filter((i): i is NavItem => i !== false);
}
