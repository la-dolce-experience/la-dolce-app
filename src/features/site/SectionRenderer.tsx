import type { ComponentType } from 'react';
import type { Section, SectionType } from '../../types/content';
import { QuoteSection } from '../quote/QuoteSection';
import { CatalogSection } from './CatalogSection';
import { CardsSection, FaqSection, HighlightsSection, StepsSection } from './ContentSections';
import { GallerySection } from './GallerySection';
import { HeroSection } from './HeroSection';
import { LocationSection } from './LocationSection';
import { hasContent } from './sectionHelpers';
import { TestimonialsSection } from './TestimonialsSection';
import { TextImageSection } from './TextImageSection';

/** Componente que desenha cada tipo de seção. Um tipo novo entra aqui e em admin/sectionTypes.ts. */
const COMPONENTS: Record<SectionType, ComponentType<{ section: Section }>> = {
  hero: HeroSection,
  texto_imagem: TextImageSection,
  cartoes: CardsSection,
  catalogo: CatalogSection,
  destaques: HighlightsSection,
  etapas: StepsSection,
  galeria: GallerySection,
  depoimentos: TestimonialsSection,
  formulario: QuoteSection,
  contato: LocationSection,
  faq: FaqSection,
};

/** As seções da página, na ordem definida no painel. Seções de lista sem itens não aparecem. */
export function SectionList({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.filter(hasContent).map((section) => {
        const Component = COMPONENTS[section.type];
        return Component ? <Component key={section.id} section={section} /> : null;
      })}
    </>
  );
}
