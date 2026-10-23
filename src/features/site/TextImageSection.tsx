import type { ReactNode } from 'react';
import { ResponsiveImage } from '../../components/ResponsiveImage/ResponsiveImage';
import { SectionHeading } from '../../components/SectionHeading/SectionHeading';
import type { ImageRef, Section } from '../../types/content';
import { opt } from './sectionHelpers';
import styles from './Sections.module.css';

interface Props {
  section: Section;
  /** Imagem à direita no desktop (texto primeiro). */
  imageRight?: boolean;
  /** Produto recortado (fundo transparente): "contain" em vez de "cover". */
  contain?: boolean;
  /** Conteúdo extra abaixo do texto e da foto (ex.: grade do catálogo). */
  children?: ReactNode;
}

/**
 * Largura exibida da foto, para o navegador escolher a variante certa.
 * Com "contain", uma foto em pé ocupa só parte da largura: a altura da moldura (ver .photo img: 70vw no celular,
 * menos o respiro de 48px) vezes a proporção. Sem isso, o celular baixaria a versão grande à toa.
 */
function photoSizes(image: ImageRef, contain: boolean): string {
  const ratio = image.width && image.height ? image.width / image.height : 1;
  if (!contain || ratio >= 1) return '(min-width: 960px) 560px, calc(100vw - 32px)';
  const r = ratio.toFixed(3);
  return `(min-width: 800px) ${Math.round(512 * ratio)}px, calc((70vw - 48px) * ${r})`;
}

/** Seção de texto + foto (base de "Texto com imagem" e "Catálogo"). */
export function SplitSection({ section, imageRight = false, contain = false, children }: Props) {
  const headingId = `${section.slug}-title`;
  return (
    <section id={section.slug} className={styles.section} aria-labelledby={headingId}>
      <div className={`container ${styles.split} ${imageRight ? styles.splitReverse : ''}`}>
        {section.image && (
          <figure className={`${styles.photo} ${contain ? styles.photoContain : ''}`}>
            <ResponsiveImage image={section.image} sizes={photoSizes(section.image, contain)} />
          </figure>
        )}
        <SectionHeading id={headingId} eyebrow={section.eyebrow} title={section.title} body={section.body} />
      </div>
      {children}
    </section>
  );
}

/** "Texto com imagem": a foto fica do lado escolhido no painel. */
export function TextImageSection({ section }: { section: Section }) {
  return (
    <SplitSection
      section={section}
      imageRight={opt(section, 'imagePosition') === 'direita'}
      contain={opt(section, 'imageFit') === 'inteira'}
    />
  );
}
