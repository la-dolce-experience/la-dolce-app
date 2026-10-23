import { Clock, ExternalLink, Mail, MapPin, Phone } from 'lucide-react';
import { useState } from 'react';
import { Button, ButtonLink } from '../../components/Button/Button';
import { WhatsAppIcon } from '../../components/icons/WhatsAppIcon';
import { SectionHeading } from '../../components/SectionHeading/SectionHeading';
import { useSiteContent } from '../../hooks/useSiteContent';
import type { Section } from '../../types/content';
import { addressLines, mapsEmbedUrl, mapsLink } from '../../utils/location';
import { formatBrazilianPhone } from '../../utils/phone';
import { buildWhatsAppUrl } from '../../utils/whatsapp';
import styles from './LocationSection.module.css';

export function LocationSection({ section }: { section: Section }) {
  const { content } = useSiteContent();
  const { settings } = content;
  const [mapLoaded, setMapLoaded] = useState(false);
  const headingId = `${section.slug}-title`;

  const address = addressLines(settings);
  const mapsHref = mapsLink(settings);
  const embedUrl = mapsEmbedUrl(settings);

  return (
    <section id={section.slug} className={styles.section} aria-labelledby={headingId}>
      <div className={`container ${styles.wrap}`}>
        <div className={styles.info}>
          <SectionHeading id={headingId} eyebrow={section.eyebrow} title={section.title} body={section.body} />

          <dl className={styles.list}>
            {settings.serviceArea && (
              <div className={styles.item}>
                <dt>
                  <MapPin aria-hidden="true" /> Área de atendimento
                </dt>
                <dd className="prewrap">{settings.serviceArea}</dd>
              </div>
            )}
            {address.length > 0 && (
              <div className={styles.item}>
                <dt>
                  <MapPin aria-hidden="true" /> Endereço
                </dt>
                <dd>
                  <address>
                    {address.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </address>
                </dd>
              </div>
            )}
            {settings.openingHours && (
              <div className={styles.item}>
                <dt>
                  <Clock aria-hidden="true" /> Horário de atendimento
                </dt>
                <dd className="prewrap">{settings.openingHours}</dd>
              </div>
            )}
            <div className={styles.item}>
              <dt>
                <WhatsAppIcon size={18} /> WhatsApp
              </dt>
              <dd>
                <a
                  href={buildWhatsAppUrl(settings.whatsappNumber, settings.whatsappGreeting)}
                  data-wa-origem={section.slug}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {formatBrazilianPhone(settings.whatsappNumber)}
                </a>
              </dd>
            </div>
            {settings.phone && (
              <div className={styles.item}>
                <dt>
                  <Phone aria-hidden="true" /> Telefone
                </dt>
                <dd>
                  <a href={`tel:+55${settings.phone}`}>{formatBrazilianPhone(settings.phone)}</a>
                </dd>
              </div>
            )}
            {settings.email && (
              <div className={styles.item}>
                <dt>
                  <Mail aria-hidden="true" /> E-mail
                </dt>
                <dd>
                  <a href={`mailto:${settings.email}`}>{settings.email}</a>
                </dd>
              </div>
            )}
          </dl>

          <div className={styles.actions}>
            <ButtonLink
              variant="whatsapp"
              href={buildWhatsAppUrl(settings.whatsappNumber, settings.whatsappGreeting)}
              data-wa-origem={section.slug}
              target="_blank"
              rel="noopener noreferrer"
              icon={<WhatsAppIcon />}
            >
              Falar pelo WhatsApp
            </ButtonLink>
            {mapsHref && (
              <ButtonLink
                variant="outline"
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                icon={<ExternalLink aria-hidden="true" />}
              >
                Abrir no Google Maps
              </ButtonLink>
            )}
          </div>
        </div>

        {embedUrl && (
          <div className={styles.map}>
            {mapLoaded ? (
              <iframe
                title={`Mapa: ${address.join(', ')}`}
                src={embedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : (
              <div className={styles.mapPlaceholder}>
                <MapPin aria-hidden="true" />
                <p>O mapa é carregado do Google Maps somente se você permitir.</p>
                <Button variant="outline" onClick={() => setMapLoaded(true)}>
                  Carregar mapa
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
