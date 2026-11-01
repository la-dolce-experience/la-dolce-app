import { MapPin } from 'lucide-react';
import { ButtonLink } from '../../components/Button/Button';
import { WhatsAppIcon } from '../../components/icons/WhatsAppIcon';
import { ResponsiveImage } from '../../components/ResponsiveImage/ResponsiveImage';
import { useSiteContent } from '../../hooks/useSiteContent';
import type { Section } from '../../types/content';
import { buildWhatsAppUrl } from '../../utils/whatsapp';
import { heroFocus, heroFormat } from './heroImage';
import { formAnchor, opt } from './sectionHelpers';
import styles from './Sections.module.css';

/** Destaque principal: título da página (h1), botões e foto. */
export function HeroSection({ section }: { section: Section }) {
  const { content } = useSiteContent();
  const { settings } = content;
  const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber, settings.whatsappGreeting);
  const form = formAnchor(content);
  const whatsappLabel = opt(section, 'whatsappLabel');
  const headingId = `${section.slug}-title`;

  return (
    <section id={section.slug} className={styles.hero} aria-labelledby={headingId}>
      <div className={`container ${styles.heroGrid}`}>
        <div className={styles.heroText}>
          {section.eyebrow && <p className={styles.eyebrow}>{section.eyebrow}</p>}
          <h1 id={headingId} className={styles.heroTitle}>
            {section.title}
          </h1>
          {section.body && <p className={`${styles.lead} prewrap`}>{section.body}</p>}
          <div className={styles.heroActions}>
            {/* Sem formulário na página, o botão principal leva direto ao WhatsApp. */}
            {form ? (
              <ButtonLink href={form} size="lg">
                {section.ctaLabel || 'Fale conosco'}
              </ButtonLink>
            ) : (
              <ButtonLink
                href={whatsappUrl}
                data-wa-origem={section.slug}
                target="_blank"
                rel="noopener noreferrer"
                size="lg"
                icon={<WhatsAppIcon />}
              >
                {section.ctaLabel || 'Fale conosco'}
              </ButtonLink>
            )}
            {form && whatsappLabel && (
              <ButtonLink
                href={whatsappUrl}
                data-wa-origem={section.slug}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
                size="lg"
                icon={<WhatsAppIcon />}
              >
                {whatsappLabel}
              </ButtonLink>
            )}
          </div>
          {section.note && (
            <p className={styles.heroNote}>
              <MapPin aria-hidden="true" />
              {section.note}
            </p>
          )}
        </div>

        {section.image && (
          <figure
            className={styles.heroCard}
            data-formato={heroFormat(section.options.imageFormat).value}
            data-foco={heroFocus(section.options.imageFocus).value}
          >
            <ResponsiveImage image={section.image} priority sizes="(min-width: 960px) 620px, 100vw" />
            {section.imageCaption && <figcaption className={styles.badge}>{section.imageCaption}</figcaption>}
          </figure>
        )}
      </div>
    </section>
  );
}
