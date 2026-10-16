import { MapPin } from 'lucide-react';
import { ButtonLink } from '../../components/Button/Button';
import { WhatsAppIcon } from '../../components/icons/WhatsAppIcon';
import { ResponsiveImage } from '../../components/ResponsiveImage/ResponsiveImage';
import { useSiteContent } from '../../hooks/useSiteContent';
import { buildWhatsAppUrl } from '../../utils/whatsapp';
import styles from './Sections.module.css';

export function HeroSection() {
  const { content } = useSiteContent();
  const { hero } = content.sections;
  const { settings } = content;

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={`container ${styles.heroGrid}`}>
        <div className={styles.heroText}>
          {hero.eyebrow && <p className={styles.eyebrow}>{hero.eyebrow}</p>}
          <h1 id="hero-title" className={styles.heroTitle}>
            {hero.title}
          </h1>
          {hero.body && <p className={`${styles.lead} prewrap`}>{hero.body}</p>}
          <div className={styles.heroActions}>
            <ButtonLink href="#orcamento" size="lg">
              {hero.ctaLabel || 'Solicitar orçamento'}
            </ButtonLink>
            <ButtonLink
              href={buildWhatsAppUrl(settings.whatsappNumber, settings.whatsappGreeting)}
              data-wa-origem="destaque"
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              size="lg"
              icon={<WhatsAppIcon />}
            >
              Tirar dúvidas no WhatsApp
            </ButtonLink>
          </div>
          {hero.note && (
            <p className={styles.heroNote}>
              <MapPin aria-hidden="true" />
              {hero.note}
            </p>
          )}
        </div>

        {hero.image && (
          <figure className={styles.heroCard}>
            <ResponsiveImage image={hero.image} priority sizes="(min-width: 960px) 620px, 100vw" />
            {hero.imageCaption && <figcaption className={styles.badge}>{hero.imageCaption}</figcaption>}
          </figure>
        )}
      </div>
    </section>
  );
}
