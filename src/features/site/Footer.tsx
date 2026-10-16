import { FacebookIcon, InstagramIcon, TikTokIcon } from '../../components/icons/SocialIcons';
import { useSiteContent } from '../../hooks/useSiteContent';
import { safeExternalUrl } from '../../utils/location';
import { formatBrazilianPhone } from '../../utils/phone';
import { buildWhatsAppUrl } from '../../utils/whatsapp';
import { buildNavItems } from './navigation';
import styles from './Footer.module.css';

export function Footer() {
  const { content } = useSiteContent();
  const { settings } = content;
  const nav = buildNavItems(content);
  const socials = [
    { label: 'Instagram', href: safeExternalUrl(settings.instagramUrl), icon: <InstagramIcon /> },
    { label: 'Facebook', href: safeExternalUrl(settings.facebookUrl), icon: <FacebookIcon /> },
    { label: 'TikTok', href: safeExternalUrl(settings.tiktokUrl), icon: <TikTokIcon /> },
  ].filter((s) => s.href);

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brand}>
          <img
            src={settings.logo.src}
            alt={settings.businessName}
            width={settings.logo.width}
            height={settings.logo.height}
            loading="lazy"
          />
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
            <li>
              <a href="#orcamento">Orçamento</a>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className={styles.heading}>Contato</h2>
          <ul>
            <li>
              <a
                href={buildWhatsAppUrl(settings.whatsappNumber, settings.whatsappGreeting)}
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
