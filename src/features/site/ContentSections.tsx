import { ArrowRight, Check, ChevronDown } from 'lucide-react';
import { ButtonLink } from '../../components/Button/Button';
import { WhatsAppIcon } from '../../components/icons/WhatsAppIcon';
import { ResponsiveImage } from '../../components/ResponsiveImage/ResponsiveImage';
import { SectionHeading } from '../../components/SectionHeading/SectionHeading';
import { useSiteContent } from '../../hooks/useSiteContent';
import { buildWhatsAppUrl } from '../../utils/whatsapp';
import { useQuoteIntent } from '../quote/QuoteIntentContext';
import styles from './Sections.module.css';

export function EventsSection() {
  const { content } = useSiteContent();
  const { requestQuote } = useQuoteIntent();
  const section = content.sections.events;
  if (!section.visible || content.eventTypes.length === 0) return null;

  return (
    <section id="eventos" className={styles.section} aria-labelledby="events-title">
      <div className="container">
        <SectionHeading
          id="events-title"
          align="center"
          eyebrow={section.eyebrow}
          title={section.title}
          body={section.body}
        />
        <ul className={styles.cards}>
          {content.eventTypes.map((event) => (
            <li key={event.id} className={styles.card}>
              <h3>{event.title}</h3>
              {event.description && <p className="prewrap">{event.description}</p>}
              <a href="#orcamento" className={styles.cardLink} onClick={() => requestQuote(event.formLabel)}>
                Pedir orçamento para {event.formLabel.toLowerCase()}
                <ArrowRight aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
        {section.ctaLabel && (
          <div className={styles.center}>
            <ButtonLink href="#orcamento" variant="dark">
              {section.ctaLabel}
            </ButtonLink>
          </div>
        )}
      </div>
    </section>
  );
}

export function PersonalizationSection() {
  const { content } = useSiteContent();
  const section = content.sections.personalization;
  const { settings } = content;
  if (!section.visible) return null;

  return (
    <section className={styles.section} aria-labelledby="personalization-title">
      <div className={`container ${styles.band}`}>
        <div className={styles.bandInner}>
          <SectionHeading
            id="personalization-title"
            tone="inverse"
            eyebrow={section.eyebrow}
            title={section.title}
            body={section.body}
          />
          {content.features.length > 0 && (
            <ul className={styles.features}>
              {content.features.map((f) => (
                <li key={f.id} className={styles.feature}>
                  <Check aria-hidden="true" />
                  {f.label}
                </li>
              ))}
            </ul>
          )}
          {section.ctaLabel && (
            <ButtonLink
              variant="light"
              href={buildWhatsAppUrl(settings.whatsappNumber, settings.whatsappGreeting)}
              data-wa-origem="personalizacao"
              target="_blank"
              rel="noopener noreferrer"
              icon={<WhatsAppIcon />}
            >
              {section.ctaLabel}
            </ButtonLink>
          )}
        </div>
      </div>
    </section>
  );
}

export function StepsSection() {
  const { content } = useSiteContent();
  const section = content.sections.steps;
  if (!section.visible || content.steps.length === 0) return null;

  return (
    <section id="como-funciona" className={styles.section} aria-labelledby="steps-title">
      <div className="container">
        <SectionHeading
          id="steps-title"
          align="center"
          eyebrow={section.eyebrow}
          title={section.title}
          body={section.body}
        />
        <ol className={styles.steps}>
          {content.steps.map((step) => (
            <li key={step.id} className={styles.step}>
              <h3>{step.title}</h3>
              {step.description && <p className="prewrap">{step.description}</p>}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function GallerySection() {
  const { content } = useSiteContent();
  const section = content.sections.gallery;
  if (!section.visible || content.gallery.length === 0) return null;

  return (
    <section id="galeria" className={styles.section} aria-labelledby="gallery-title">
      <div className="container">
        <SectionHeading
          id="gallery-title"
          align="center"
          eyebrow={section.eyebrow}
          title={section.title}
          body={section.body}
        />
        <ul className={styles.gallery}>
          {content.gallery.map((item, index) => (
            <li key={item.id}>
              <figure className={styles.galleryItem}>
                <ResponsiveImage
                  image={item.image}
                  sizes={
                    index === 0
                      ? '(min-width: 960px) 680px, 100vw'
                      : '(min-width: 960px) 440px, (min-width: 640px) 50vw, 100vw'
                  }
                />
                {item.caption && <figcaption>{item.caption}</figcaption>}
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function TestimonialsSection() {
  const { content } = useSiteContent();
  const section = content.sections.testimonials;
  if (!section.visible || content.testimonials.length === 0) return null;

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
        <ul className={styles.testimonials}>
          {content.testimonials.map((t) => (
            <li key={t.id}>
              <figure className={styles.testimonial}>
                <blockquote className="prewrap">“{t.quote}”</blockquote>
                <figcaption>
                  <strong>{t.author}</strong>
                  {t.context && ` · ${t.context}`}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function FaqSection() {
  const { content } = useSiteContent();
  const section = content.sections.faq;
  if (!section.visible || content.faqs.length === 0) return null;

  return (
    <section id="duvidas" className={styles.section} aria-labelledby="faq-title">
      <div className="container">
        <SectionHeading
          id="faq-title"
          align="center"
          eyebrow={section.eyebrow}
          title={section.title}
          body={section.body}
        />
        <div className={styles.faqList}>
          {content.faqs.map((faq) => (
            <details key={faq.id} className={styles.faqItem}>
              <summary>
                {faq.question}
                <ChevronDown aria-hidden="true" />
              </summary>
              <p className="prewrap">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
