import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ResponsiveImage } from '../../components/ResponsiveImage/ResponsiveImage';
import { SectionHeading } from '../../components/SectionHeading/SectionHeading';
import { useSiteContent } from '../../hooks/useSiteContent';
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

/** Depoimentos em carrossel: arrastar (celular), setas e pontos. 1, 2 ou 3 por vez conforme a tela. */
export function TestimonialsSection() {
  const { content } = useSiteContent();
  const section = content.sections.testimonials;
  const items = content.testimonials;
  const trackRef = useRef<HTMLUListElement>(null);
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

  if (!section.visible || items.length === 0) return null;

  function goTo(index: number) {
    const track = trackRef.current;
    const slides = track ? (Array.from(track.children) as HTMLElement[]) : [];
    const target = slides[Math.max(0, Math.min(index, slides.length - 1))];
    if (!track || !target) return;
    track.scrollTo?.({ left: target.offsetLeft - slides[0].offsetLeft });
  }

  const scrollable = state.canPrev || state.canNext;

  return (
    <section id="depoimentos" className={styles.section} aria-labelledby="testimonials-title">
      <div className="container">
        <SectionHeading
          id="testimonials-title"
          align="center"
          eyebrow={section.eyebrow}
          title={section.title}
          body={section.body}
        />
        <div className={styles.carousel} role="region" aria-roledescription="carrossel" aria-label="Depoimentos">
          <ul ref={trackRef} className={styles.testimonials} onScroll={update}>
            {items.map((t, i) => (
              <li key={t.id} role="group" aria-roledescription="depoimento" aria-label={`${i + 1} de ${items.length}`}>
                <figure className={styles.testimonial}>
                  <Stars rating={t.rating} />
                  <blockquote className="prewrap">“{t.quote}”</blockquote>
                  <figcaption>
                    {t.image && <ResponsiveImage image={t.image} sizes="56px" className={styles.avatar} alt="" />}
                    <span>
                      <strong>{t.author}</strong>
                      {t.context && <span className={styles.testimonialContext}>{t.context}</span>}
                    </span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
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
