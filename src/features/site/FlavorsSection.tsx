import { ResponsiveImage } from '../../components/ResponsiveImage/ResponsiveImage';
import { useSiteContent } from '../../hooks/useSiteContent';
import type { FlavorItem } from '../../types/content';
import { SplitSection } from './SplitSection';
import styles from './Sections.module.css';

/** "Sabores e apresentação": texto + foto do produto, seguidos das listas cadastradas no painel. */
export function FlavorsSection() {
  const { content } = useSiteContent();
  const section = content.sections.flavors;
  if (!section.visible) return null;
  const { flavors, presentations } = content;

  return (
    <SplitSection id="sabores" section={section} imageRight contain>
      {(flavors.length > 0 || presentations.length > 0) && (
        <div className={`container ${styles.flavorLists}`}>
          <FlavorList id="flavors-list-title" title="Sabores" items={flavors} />
          <FlavorList id="presentations-list-title" title="Apresentações" items={presentations} />
        </div>
      )}
    </SplitSection>
  );
}

function FlavorList({ id, title, items }: { id: string; title: string; items: FlavorItem[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby={id} className={styles.flavorGroup}>
      <h3 id={id} className={styles.flavorGroupTitle}>
        {title}
      </h3>
      <ul className={styles.flavorGrid}>
        {items.map((item) => (
          <li key={item.id} className={`${styles.flavorCard} ${item.image ? styles.flavorCardPhoto : ''}`}>
            {item.image && (
              <ResponsiveImage image={item.image} sizes="(min-width: 960px) 260px, (min-width: 640px) 33vw, 50vw" />
            )}
            <div>
              <h4>{item.title}</h4>
              {item.description && <p className="prewrap">{item.description}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
