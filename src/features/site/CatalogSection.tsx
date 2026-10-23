import { ResponsiveImage } from '../../components/ResponsiveImage/ResponsiveImage';
import type { ImageRef, Section } from '../../types/content';
import { opt } from './sectionHelpers';
import { SplitSection } from './TextImageSection';
import styles from './Sections.module.css';

/**
 * A foto fica num quadrado com "contain": uma foto em pé ocupa só parte da largura do
 * cartão. Escala a largura informada ao navegador pela proporção, para o celular não baixar a versão grande.
 */
function cardSizes(image: ImageRef): string {
  const ratio = image.width && image.height ? Math.min(1, image.width / image.height) : 1;
  if (ratio === 1) return '(min-width: 960px) 260px, (min-width: 640px) 33vw, 50vw';
  const r = ratio.toFixed(3);
  return `(min-width: 960px) ${Math.round(260 * ratio)}px, (min-width: 640px) calc(33vw * ${r}), calc(50vw * ${r})`;
}

function CatalogGrid({ section }: { section: Section }) {
  return (
    <ul className={styles.flavorGrid}>
      {section.items.map((item) => (
        <li key={item.id} className={`${styles.flavorCard} ${item.image ? styles.flavorCardPhoto : ''}`}>
          {item.image && <ResponsiveImage image={item.image} sizes={cardSizes(item.image)} />}
          <div>
            <h4>{item.title}</h4>
            {item.label && <p className={styles.itemLabel}>{item.label}</p>}
            {item.description && <p className="prewrap">{item.description}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * "Catálogo": texto + foto da seção, seguidos da grade de produtos ou serviços cadastrados no painel.
 * Sem título, texto e foto, mostra só a grade, colada na seção anterior (ex.: sabores e apresentações
 * logo abaixo de "Sabores e apresentação").
 */
export function CatalogSection({ section }: { section: Section }) {
  const listTitle = opt(section, 'listTitle');
  const listId = `${section.slug}-lista`;

  if (!section.eyebrow && !section.title && !section.body && !section.image) {
    return (
      <section
        id={section.slug}
        className={`${styles.section} ${styles.catalogCompact}`}
        aria-labelledby={listTitle ? listId : undefined}
        aria-label={listTitle ? undefined : 'Catálogo'}
      >
        <div className={`container ${styles.flavorGroup}`}>
          {listTitle && (
            <h2 id={listId} className={styles.flavorGroupTitle}>
              {listTitle}
            </h2>
          )}
          <CatalogGrid section={section} />
        </div>
      </section>
    );
  }

  return (
    <SplitSection section={section} imageRight={opt(section, 'imagePosition', 'direita') === 'direita'} contain>
      <div className={`container ${styles.flavorLists}`}>
        <section aria-labelledby={listTitle ? listId : `${section.slug}-title`} className={styles.flavorGroup}>
          {listTitle && (
            <h3 id={listId} className={styles.flavorGroupTitle}>
              {listTitle}
            </h3>
          )}
          <CatalogGrid section={section} />
        </section>
      </div>
    </SplitSection>
  );
}
