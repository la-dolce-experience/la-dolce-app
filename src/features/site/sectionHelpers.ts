import type { Section, SectionType, SiteContent } from '../../types/content';
import type { QuoteMessageLabels } from '../../utils/whatsapp';

/** Opção de texto da seção, com valor padrão quando não foi definida no painel. */
export function opt(section: Section, key: string, fallback = ''): string {
  const value = section.options[key];
  return typeof value === 'string' ? value : fallback;
}

/** Opção liga/desliga da seção. */
export function flag(section: Section, key: string, fallback = false): boolean {
  const value = section.options[key];
  return typeof value === 'boolean' ? value : fallback;
}

export function findSection(content: SiteContent, type: SectionType): Section | undefined {
  return content.sections.find((s) => s.type === type);
}

/** Âncora do formulário de contato (#slug), se ele estiver no site. */
export function formAnchor(content: SiteContent): string | null {
  const form = findSection(content, 'formulario');
  return form ? `#${form.slug}` : null;
}

/** Opções do campo "Assunto" do formulário: o rótulo de cada cartão que tem um. */
export function formSubjects(content: SiteContent): string[] {
  return [
    ...new Set(
      content.sections
        .filter((s) => s.type === 'cartoes')
        .flatMap((s) => s.items.map((i) => i.label.trim()))
        .filter(Boolean),
    ),
  ];
}

/** Seções que só aparecem com itens cadastrados (sem itens, não há o que mostrar). */
const NEEDS_ITEMS: SectionType[] = ['cartoes', 'catalogo', 'etapas', 'galeria', 'depoimentos', 'faq'];

export function hasContent(section: Section): boolean {
  return !NEEDS_ITEMS.includes(section.type) || section.items.length > 0;
}

/** Rótulos dos campos configuráveis (painel → seção do formulário → opções). */
export function formLabels(section: Section): QuoteMessageLabels {
  return {
    subject: opt(section, 'subjectLabel') || 'Tipo de evento',
    date: opt(section, 'dateLabel') || 'Data desejada',
    quantity: opt(section, 'quantityLabel') || 'Quantidade',
    location: opt(section, 'locationLabel') || 'Cidade ou local',
    details: opt(section, 'messageLabel') || 'Mensagem',
  };
}
