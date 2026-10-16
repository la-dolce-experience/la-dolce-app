import { ResponsiveImage } from '../../components/ResponsiveImage/ResponsiveImage';
import { SectionHeading } from '../../components/SectionHeading/SectionHeading';
import type { Section } from '../../types/content';
import styles from './Sections.module.css';

interface Props {
  id?: string;
  section: Section;
  /** Imagem à direita no desktop (texto primeiro). */
  imageRight?: boolean;
  /** Produto recortado (fundo transparente): "contain" em vez de "cover". */
  contain?: boolean;
}

/** Seção de texto + foto, usada em "Experiência" e "Sabores e apresentação". */
export function SplitSection({ id, section, imageRight = false, contain = false }: Props) {
  if (!section.visible) return null;
  const headingId = `${section.key}-title`;
  return (
    <section id={id} className={styles.section} aria-labelledby={headingId}>
      <div className={`container ${styles.split} ${imageRight ? styles.splitReverse : ''}`}>
        {section.image && (
          <figure className={`${styles.photo} ${contain ? styles.photoContain : ''}`}>
            <ResponsiveImage image={section.image} sizes="(min-width: 960px) 560px, 100vw" />
          </figure>
        )}
        <SectionHeading id={headingId} eyebrow={section.eyebrow} title={section.title} body={section.body} />
      </div>
    </section>
  );
}
