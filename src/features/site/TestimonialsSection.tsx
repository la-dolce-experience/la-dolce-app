import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Lightbox } from '../../components/Lightbox/Lightbox';
import { ResponsiveImage } from '../../components/ResponsiveImage/ResponsiveImage';
import { SectionHeading } from '../../components/SectionHeading/SectionHeading';
import type { Section, SectionItem } from '../../types/content';
import styles from './Sections.module.css';

export function Stars({ rating }: { rating: number }) {
  return (
    <p className={styles.stars} role="img" aria-label={`Avaliação: ${rating} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} aria-hidden="true" className={n <= rating ? styles.starOn : undefined} />
      ))}
    </p>
  );
}

/** Acima deste número, mostra as 2 primeiras fotos e a terceira desfocada com "+N" (como na galeria). */
const MAX_THUMBS = 3;

/** Fotos do evento de um depoimento: miniaturas que abrem em tela cheia, em carrossel. */
function EventPhotos({ testimonial }: { testimonial: SectionItem }) {
  const [open, setOpen] = useState<number | null>(null);
  const { photos, title: author } = testimonial;
  if (photos.length === 0) return null;

  const collapsed = photos.length > MAX_THUMBS;
  const hidden = photos.length - (MAX_THUMBS - 1);

  return (
    <>
      <ul className={styles.eventPhotos} aria-label={`Fotos do evento de ${author}`}>
        {photos.slice(0, MAX_THUMBS).map((photo, index) => {
          const more = collapsed && index === MAX_THUMBS - 1;
          return (
            <li key={`${photo.mediaId ?? photo.src}-${index}`}>
              <button
                type="button"
                className={`${styles.eventPhoto} ${more ? styles.galleryMore : ''}`}
                onClick={() => setOpen(index)}
                aria-haspopup="dialog"
                aria-label={
                  more
                    ? `Ver todas as ${photos.length} fotos do evento de ${author}`
                    : `Ampliar foto ${index + 1} de ${photos.length} do evento de ${author}`
                }
              >
                <ResponsiveImage image={photo} sizes="120px" alt="" />
                {more && (
                  <span className={styles.eventPhotoMore} aria-hidden="true">
                    +{hidden}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {open !== null && (
        <Lightbox
          items={photos.map((image, i) => ({
            id: `${testimonial.id}-${i}`,
            image,
            caption: [author, testimonial.label].filter(Boolean).join(' · '),
          }))}
          start={open}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}

/** Depoimentos em carrossel: arrastar (celular), setas e pontos. 1, 2 ou 3 por vez conforme a tela. */
export function TestimonialsSection({ section }: { section: Section }) {
  const items = section.items;
  const headingId = `${section.slug}-title`;
  const trackRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ active: 0, canPrev: false, canNext: false });

  const update = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const slides = Array.from(track.children) as HTMLElement[];
    const origin = slides[0]?.offsetLeft ?? 0;
    // Slide ativo: o primeiro cuja borda esquerda está mais perto do início da área visível.
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

  const scrollable = state.canPrev || state.canNext;

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
        <div className={styles.carousel} role="region" aria-roledescription="carrossel" aria-label="Depoimentos">
          {/* Cada slide é um grupo, como no padrão de carrossel acessível; por isso div, e não lista. */}
          <div ref={trackRef} className={styles.testimonials} onScroll={update}>
            {items.map((t, i) => (
              <div key={t.id} role="group" aria-roledescription="depoimento" aria-label={`${i + 1} de ${items.length}`}>
                <figure className={styles.testimonial}>
                  <Stars rating={t.rating} />
                  <blockquote className="prewrap">“{t.description}”</blockquote>
                  <EventPhotos testimonial={t} />
                  <figcaption>
                    {t.image && <ResponsiveImage image={t.image} sizes="56px" className={styles.avatar} alt="" />}
                    <span>
                      <strong>{t.title}</strong>
                      {t.label && <span className={styles.testimonialContext}>{t.label}</span>}
                    </span>
                  </figcaption>
                </figure>
              </div>
            ))}
          </div>
          {scrollable && (
            <div className={styles.carouselControls}>
              <button
                type="button"
                className={styles.carouselButton}
                onClick={() => goTo(state.active - 1)}
                disabled={!state.canPrev}
                aria-label="Depoimento anterior"
              >
                <ChevronLeft aria-hidden="true" />
              </button>
              <ol className={styles.dots}>
                {items.map((t, i) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      aria-label={`Ir para o depoimento ${i + 1}`}
                      aria-current={i === state.active ? 'true' : undefined}
                      onClick={() => goTo(i)}
                    />
                  </li>
                ))}
              </ol>
              <button
                type="button"
                className={styles.carouselButton}
                onClick={() => goTo(state.active + 1)}
                disabled={!state.canNext}
                aria-label="Próximo depoimento"
              >
                <ChevronRight aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
