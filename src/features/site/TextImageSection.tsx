import type { ReactNode } from 'react';
import { ButtonLink } from '../../components/Button/Button';
import { WhatsAppIcon } from '../../components/icons/WhatsAppIcon';
import { ResponsiveImage } from '../../components/ResponsiveImage/ResponsiveImage';
import { SectionHeading } from '../../components/SectionHeading/SectionHeading';
import { useSiteContent } from '../../hooks/useSiteContent';
import type { ImageRef, Section } from '../../types/content';
import { buildWhatsAppUrl } from '../../utils/whatsapp';
import { PhotoCarousel } from './PhotoCarousel';
import { CAROUSEL_SECONDS, opt } from './sectionHelpers';
import styles from './Sections.module.css';

interface Props {
  section: Section;
  /** Imagem à direita no desktop (texto primeiro). */
  imageRight?: boolean;
  /** Produto recortado (fundo transparente): "contain" em vez de "cover". */
  contain?: boolean;
  /** Mais de uma foto: carrossel que troca sozinho no lugar da foto única. */
  photos?: ImageRef[];
  /** Tempo de cada foto do carrossel, em milissegundos. */
  interval?: number;
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

/** Seção de texto + foto (base de "Texto com imagem" e "Catálogo"), com o botão opcional do WhatsApp. */
export function SplitSection({
  section,
  imageRight = false,
  contain = false,
  photos,
  interval = 5000,
  children,
}: Props) {
  const { content } = useSiteContent();
  const { settings } = content;
  const headingId = `${section.slug}-title`;
  const frame = `${styles.photo} ${contain ? styles.photoContain : ''}`;
  const images = photos ?? (section.image ? [section.image] : []);

  return (
    <section id={section.slug} className={styles.section} aria-labelledby={headingId}>
      <div className={`container ${styles.split} ${imageRight ? styles.splitReverse : ''}`}>
        {images.length > 1 ? (
          <PhotoCarousel
            images={images}
            label={section.title ? `Fotos: ${section.title}` : 'Fotos'}
            frameClassName={frame}
            sizes={(image) => photoSizes(image, contain)}
            interval={interval}
          />
        ) : (
          images[0] && (
            <figure className={frame}>
              <ResponsiveImage image={images[0]} sizes={photoSizes(images[0], contain)} />
            </figure>
          )
        )}
        <div className={styles.splitText}>
          <SectionHeading id={headingId} eyebrow={section.eyebrow} title={section.title} body={section.body} />
          {section.ctaLabel && (
            <ButtonLink
              variant="whatsapp"
              href={buildWhatsAppUrl(settings.whatsappNumber, settings.whatsappGreeting)}
              data-wa-origem={section.slug}
              target="_blank"
              rel="noopener noreferrer"
              icon={<WhatsAppIcon />}
            >
              {section.ctaLabel}
            </ButtonLink>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

/**
 * "Texto com imagem": a foto fica do lado escolhido no painel. Com fotos na lista da seção, a foto principal
 * e as da lista (nessa ordem) viram um carrossel que troca sozinho.
 */
export function TextImageSection({ section }: { section: Section }) {
  const extra = section.items.flatMap((item) => (item.image ? [item.image] : []));
  const photos = [...(section.image ? [section.image] : []), ...extra];
  const seconds = opt(section, 'carouselSeconds', '5');
  return (
    <SplitSection
      section={section}
      imageRight={opt(section, 'imagePosition') === 'direita'}
      contain={opt(section, 'imageFit') === 'inteira'}
      photos={photos}
      interval={Number(CAROUSEL_SECONDS.includes(seconds) ? seconds : '5') * 1000}
    />
  );
}
