import type { ComponentType } from 'react';
import type { Section, SectionType } from '../../types/content';
import { QuoteSection } from '../quote/QuoteSection';
import { CatalogSection } from './CatalogSection';
import { CardsSection, FaqSection, HighlightsSection, StepsSection } from './ContentSections';
import { GallerySection } from './GallerySection';
import { HeroSection } from './HeroSection';
import { LocationSection } from './LocationSection';
import { hasContent } from './sectionHelpers';
import { sectionTheme } from './sectionThemes';
import styles from './Sections.module.css';
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

const THEME_CLASS = { creme: styles.themeCreme, rosa: styles.themeRosa, acai: styles.themeAcai };

/**
 * As seções da página, na ordem definida no painel. Seções de lista sem itens não aparecem.
 * Uma seção com cor de fundo (ver sectionThemes.ts) fica dentro de uma faixa da largura da tela.
 */
export function SectionList({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.filter(hasContent).map((section) => {
        const Component = COMPONENTS[section.type];
        if (!Component) return null;
        const theme = sectionTheme(section.type, section.options.theme);
        if (!theme) return <Component key={section.id} section={section} />;
        return (
          <div key={section.id} className={`${styles.themed} ${THEME_CLASS[theme]}`} data-tema={theme}>
            <Component section={section} />
          </div>
        );
      })}
    </>
  );
}
