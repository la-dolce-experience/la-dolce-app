import { useState } from 'react';
import { Lightbox } from '../../components/Lightbox/Lightbox';
import { ResponsiveImage } from '../../components/ResponsiveImage/ResponsiveImage';
import { SectionHeading } from '../../components/SectionHeading/SectionHeading';
import type { Section } from '../../types/content';
import styles from './Sections.module.css';

/** Acima deste número de fotos, a página mostra só as primeiras e um botão "+N" para ver todas. */
const MAX_TILES = 3;

export function GallerySection({ section }: { section: Section }) {
  const [open, setOpen] = useState<number | null>(null);
  // Na galeria todo item tem foto (mapContent descarta os que perderam a imagem).
  const items = section.items.map((i) => ({ id: i.id, image: i.image!, caption: i.description }));
  const headingId = `${section.slug}-title`;

  const collapsed = items.length > MAX_TILES;
  const tiles = items.slice(0, MAX_TILES);
  // A terceira foto fica desfocada sob o "+N": ela e as seguintes ainda não foram vistas.
  const hidden = items.length - (MAX_TILES - 1);

  return (
    <section id={section.slug} className={styles.section} aria-labelledby={headingId}>
      <div className="container">
        <SectionHeading
          id={headingId}
          align="center"
          eyebrow={section.eyebrow}
          title={section.title}
          body={section.body}
        />
        <ul className={styles.gallery}>
          {tiles.map((item, index) => {
            const more = collapsed && index === MAX_TILES - 1;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`${styles.galleryItem} ${more ? styles.galleryMore : ''}`}
                  onClick={() => setOpen(index)}
                  aria-haspopup="dialog"
                  aria-label={
                    more ? `Ver todas as ${items.length} fotos` : `Ampliar foto ${index + 1} de ${items.length}`
                  }
                >
                  <ResponsiveImage
                    image={item.image}
                    sizes={
                      index === 0
                        ? '(min-width: 960px) 680px, 100vw'
                        : '(min-width: 960px) 440px, (min-width: 640px) 50vw, 100vw'
                    }
                  />
                  {more ? (
                    <span className={styles.moreLabel} aria-hidden="true">
                      +{hidden}
                      <small>fotos</small>
                    </span>
                  ) : (
                    item.caption && <span className={styles.galleryCaption}>{item.caption}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      {open !== null && <Lightbox items={items} start={open} onClose={() => setOpen(null)} />}
    </section>
  );
}
