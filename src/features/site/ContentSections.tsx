import { ArrowRight, Check, ChevronDown } from 'lucide-react';
import { ButtonLink } from '../../components/Button/Button';
import { WhatsAppIcon } from '../../components/icons/WhatsAppIcon';
import { SectionHeading } from '../../components/SectionHeading/SectionHeading';
import { useSiteContent } from '../../hooks/useSiteContent';
import type { Section } from '../../types/content';
import { buildWhatsAppUrl } from '../../utils/whatsapp';
import { useQuoteIntent } from '../quote/QuoteIntentContext';
import { formAnchor, opt } from './sectionHelpers';
import styles from './Sections.module.css';

/** "Cartões": cada cartão com rótulo vira opção do formulário e ganha o link "Pedir orçamento para ...". */
export function CardsSection({ section }: { section: Section }) {
  const { content } = useSiteContent();
  const { requestQuote } = useQuoteIntent();
  const form = formAnchor(content);
  const linkLabel = opt(section, 'linkLabel');
  const headingId = `${section.slug}-title`;

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
        <ul className={styles.cards}>
          {section.items.map((card) => (
            <li key={card.id} className={styles.card}>
              <h3>{card.title}</h3>
              {card.description && <p className="prewrap">{card.description}</p>}
              {form && linkLabel && card.label && (
                <a href={form} className={styles.cardLink} onClick={() => requestQuote(card.label)}>
                  {linkLabel} para {card.label.toLowerCase()}
                  <ArrowRight aria-hidden="true" />
                </a>
              )}
            </li>
          ))}
        </ul>
        {section.ctaLabel && form && (
          <div className={styles.center}>
            <ButtonLink href={form} variant="dark">
              {section.ctaLabel}
            </ButtonLink>
          </div>
        )}
      </div>
    </section>
  );
}

/** "Destaques": faixa de contraste com a lista de diferenciais e o botão do WhatsApp. */
export function HighlightsSection({ section }: { section: Section }) {
  const { content } = useSiteContent();
  const { settings } = content;
  const headingId = `${section.slug}-title`;

  return (
    <section id={section.slug} className={styles.section} aria-labelledby={headingId}>
      <div className={`container ${styles.band}`}>
        <div className={styles.bandInner}>
          <SectionHeading
            id={headingId}
            tone="inverse"
            eyebrow={section.eyebrow}
            title={section.title}
            body={section.body}
          />
          {section.items.length > 0 && (
            <ul className={styles.features}>
              {section.items.map((f) => (
                <li key={f.id} className={styles.feature}>
                  <Check aria-hidden="true" />
                  {f.title}
                </li>
              ))}
            </ul>
          )}
          {section.ctaLabel && (
            <ButtonLink
              variant="light"
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
    </section>
  );
}

/** "Etapas": passo a passo numerado. */
export function StepsSection({ section }: { section: Section }) {
  const headingId = `${section.slug}-title`;
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
        <ol className={styles.steps}>
          {section.items.map((step) => (
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

/** "Perguntas frequentes": cada pergunta abre a resposta. */
export function FaqSection({ section }: { section: Section }) {
  const headingId = `${section.slug}-title`;
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
        <div className={styles.faqList}>
          {section.items.map((faq) => (
            <details key={faq.id} className={styles.faqItem}>
              <summary>
                {faq.title}
                <ChevronDown aria-hidden="true" />
              </summary>
              <p className="prewrap">{faq.description}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
