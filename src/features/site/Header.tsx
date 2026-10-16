import { Menu, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { ButtonLink } from '../../components/Button/Button';
import { useSiteContent } from '../../hooks/useSiteContent';
import { buildNavItems } from './navigation';
import styles from './Header.module.css';

export function Header() {
  const { content } = useSiteContent();
  const { settings } = content;
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navItems = buildNavItems(content);

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
          <img
            src={settings.logo.src}
            alt=""
            width={settings.logo.width}
            height={settings.logo.height}
            className={styles.logo}
          />
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
          <ButtonLink href="#orcamento" size="sm" className={styles.cta}>
            Pedir orçamento
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
            <a href="#orcamento" className={styles.mobileCta} onClick={() => setOpen(false)}>
              Pedir orçamento
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
