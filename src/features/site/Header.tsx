import { Menu, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { ButtonLink } from '../../components/Button/Button';
import { useSiteContent } from '../../hooks/useSiteContent';
import { buildWhatsAppUrl } from '../../utils/whatsapp';
import { buildNavItems } from './navigation';
import { findSection } from './sectionHelpers';
import styles from './Header.module.css';

export function Header() {
  const { content } = useSiteContent();
  const { settings } = content;
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navItems = buildNavItems(content);
  // Botão de destaque: leva ao formulário; sem formulário na página, abre o WhatsApp.
  const form = findSection(content, 'formulario');
  const cta = form
    ? { href: `#${form.slug}`, label: form.navLabel.trim() || 'Fale conosco', external: false }
    : {
        href: buildWhatsAppUrl(settings.whatsappNumber, settings.whatsappGreeting),
        label: 'Fale conosco',
        external: true,
      };
  const ctaProps = cta.external ? { target: '_blank', rel: 'noopener noreferrer', 'data-wa-origem': 'cabecalho' } : {};

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onResize = () => window.innerWidth >= 960 && setOpen(false);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.bar}`}>
        <a className={styles.brand} href="#inicio" aria-label={`${settings.businessName} — início`}>
          {settings.logo ? (
            <img
              src={settings.logo.src}
              srcSet={settings.logo.srcSet}
              sizes={settings.logo.srcSet ? '(min-width: 768px) 116px, 92px' : undefined}
              alt=""
              width={settings.logo.width}
              height={settings.logo.height}
              className={styles.logo}
            />
          ) : (
            <span className={styles.brandName} aria-hidden="true">
              {settings.businessName}
            </span>
          )}
        </a>

        <nav aria-label="Principal" className={styles.desktopNav}>
          <ul>
            {navItems.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions}>
          <ButtonLink href={cta.href} size="sm" className={styles.cta} {...ctaProps}>
            {cta.label}
          </ButtonLink>
          <button
            ref={toggleRef}
            type="button"
            className={styles.toggle}
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            <span className="visually-hidden">{open ? 'Fechar menu' : 'Abrir menu'}</span>
          </button>
        </div>
      </div>

      <nav id={menuId} aria-label="Menu móvel" className={styles.mobileNav} hidden={!open}>
        <ul className="container">
          {navItems.map((item) => (
            <li key={item.href}>
              <a href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </a>
            </li>
          ))}
          <li>
            <a href={cta.href} className={styles.mobileCta} onClick={() => setOpen(false)} {...ctaProps}>
              {cta.label}
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
