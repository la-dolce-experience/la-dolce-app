import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
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

type CatalogItem = Section['items'][number];

function CardBody({ item }: { item: CatalogItem }) {
  return (
    <>
      {item.image && <ResponsiveImage image={item.image} sizes={cardSizes(item.image)} />}
      <div>
        <h4>{item.title}</h4>
        {item.label && <p className={styles.itemLabel}>{item.label}</p>}
        {item.description && <p className="prewrap">{item.description}</p>}
      </div>
    </>
  );
}

const cardClass = (item: CatalogItem) => `${styles.flavorCard} ${item.image ? styles.flavorCardPhoto : ''}`;

/**
 * Cartões em carrossel (opção "Exibir os cartões" do painel): arrastar para os lados no celular e setas,
 * como nos depoimentos. Mostra parte do próximo cartão para indicar que há mais; as setas só aparecem
 * quando os cartões não cabem todos na tela.
 */
function CatalogCarousel({ section, label }: { section: Section; label: string }) {
  const items = section.items;
  const trackRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ active: 0, canPrev: false, canNext: false });

  const update = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const slides = Array.from(track.children) as HTMLElement[];
    const origin = slides[0]?.offsetLeft ?? 0;
    // Cartão ativo: o primeiro cuja borda esquerda está mais perto do início da área visível.
    let active = 0;
    slides.forEach((slide, i) => {
      if (
        Math.abs(slide.offsetLeft - origin - track.scrollLeft) <
        Math.abs(slides[active].offsetLeft - origin - track.scrollLeft)
      )
        active = i;
    });
    const max = track.scrollWidth - track.clientWidth;
    setState({ active, canPrev: track.scrollLeft > 4, canNext: track.scrollLeft < max - 4 });
  }, []);

  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [update, items.length]);

  function goTo(index: number) {
    const track = trackRef.current;
    const slides = track ? (Array.from(track.children) as HTMLElement[]) : [];
    const target = slides[Math.max(0, Math.min(index, slides.length - 1))];
    if (!track || !target) return;
    track.scrollTo?.({ left: target.offsetLeft - slides[0].offsetLeft });
  }

  return (
    <div role="region" aria-roledescription="carrossel" aria-label={label} data-testid="catalog-carousel">
      {/* Cada cartão é um grupo, como no padrão de carrossel acessível; por isso div, e não lista. */}
      <div ref={trackRef} className={styles.flavorCarousel} onScroll={update}>
        {items.map((item, i) => (
          <div
            key={item.id}
            role="group"
            aria-roledescription="cartão"
            aria-label={`${i + 1} de ${items.length}`}
            className={cardClass(item)}
          >
            <CardBody item={item} />
          </div>
        ))}
      </div>
      {(state.canPrev || state.canNext) && (
        <div className={styles.carouselControls}>
          <button
            type="button"
            className={styles.carouselButton}
            onClick={() => goTo(state.active - 1)}
            disabled={!state.canPrev}
            aria-label="Cartão anterior"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.carouselButton}
            onClick={() => goTo(state.active + 1)}
            disabled={!state.canNext}
            aria-label="Próximo cartão"
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

function CatalogGrid({ section, label }: { section: Section; label: string }) {
  if (opt(section, 'listLayout', 'grade') === 'carrossel' && section.items.length > 1) {
    return <CatalogCarousel section={section} label={label} />;
  }
  return (
    <ul className={styles.flavorGrid}>
      {section.items.map((item) => (
        <li key={item.id} className={cardClass(item)}>
          <CardBody item={item} />
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
          <CatalogGrid section={section} label={listTitle || section.title || 'Catálogo'} />
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
          <CatalogGrid section={section} label={listTitle || section.title || 'Catálogo'} />
        </section>
      </div>
    </SplitSection>
  );
}
