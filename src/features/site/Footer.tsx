import { FacebookIcon, InstagramIcon, TikTokIcon } from '../../components/icons/SocialIcons';
import { useSiteContent } from '../../hooks/useSiteContent';
import { safeExternalUrl } from '../../utils/location';
import { formatBrazilianPhone } from '../../utils/phone';
import { buildWhatsAppUrl } from '../../utils/whatsapp';
import { buildNavItems } from './navigation';
import { findSection } from './sectionHelpers';
import styles from './Footer.module.css';

export function Footer() {
  const { content } = useSiteContent();
  const { settings } = content;
  const nav = buildNavItems(content);
  const form = findSection(content, 'formulario');
  const socials = [
    { label: 'Instagram', href: safeExternalUrl(settings.instagramUrl), icon: <InstagramIcon /> },
    { label: 'Facebook', href: safeExternalUrl(settings.facebookUrl), icon: <FacebookIcon /> },
    { label: 'TikTok', href: safeExternalUrl(settings.tiktokUrl), icon: <TikTokIcon /> },
  ].filter((s) => s.href);

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brand}>
          {settings.logo ? (
            <img
              src={settings.logo.src}
              srcSet={settings.logo.srcSet}
              sizes={settings.logo.srcSet ? '132px' : undefined}
              alt={settings.businessName}
              width={settings.logo.width}
              height={settings.logo.height}
              loading="lazy"
            />
          ) : (
            <p className={styles.brandName}>{settings.businessName}</p>
          )}
          {settings.footerTagline && <p>{settings.footerTagline}</p>}
        </div>

        <nav aria-label="Rodapé">
          <h2 className={styles.heading}>Navegação</h2>
          <ul>
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
            {form && (
              <li>
                <a href={`#${form.slug}`}>{form.navLabel.trim() || 'Fale conosco'}</a>
              </li>
            )}
          </ul>
        </nav>

        <div>
          <h2 className={styles.heading}>Contato</h2>
          <ul>
            <li>
              <a
                href={buildWhatsAppUrl(settings.whatsappNumber, settings.whatsappGreeting)}
                data-wa-origem="rodape"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp {formatBrazilianPhone(settings.whatsappNumber)}
              </a>
            </li>
            {settings.email && (
              <li>
                <a href={`mailto:${settings.email}`}>{settings.email}</a>
              </li>
            )}
            {settings.serviceArea && <li>{settings.serviceArea}</li>}
          </ul>
          {socials.length > 0 && (
            <ul className={styles.socials}>
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${settings.businessName} no ${s.label}`}
                  >
                    {s.icon}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className={`container ${styles.bottom}`}>
        <p>
          © {new Date().getFullYear()} {settings.businessName}
        </p>
      </div>
    </footer>
  );
}
