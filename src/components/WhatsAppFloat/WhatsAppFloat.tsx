import { useEffect, useState } from 'react';
import { buildWhatsAppUrl } from '../../utils/whatsapp';
import { WhatsAppIcon } from '../icons/WhatsAppIcon';
import styles from './WhatsAppFloat.module.css';

interface Props {
  number: string;
  greeting: string;
  /** id de uma seção onde o botão deve se esconder (ex.: o formulário, que já leva ao WhatsApp). */
  hideWhenVisibleId?: string;
}

export function WhatsAppFloat({ number, greeting, hideWhenVisibleId }: Props) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!hideWhenVisibleId || typeof IntersectionObserver === 'undefined') return;
    const target = document.getElementById(hideWhenVisibleId);
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setHidden(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hideWhenVisibleId]);

  return (
    <a
      href={buildWhatsAppUrl(number, greeting)}
      data-wa-origem="botao_flutuante"
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.float} ${hidden ? styles.hidden : ''}`}
      aria-label="Conversar pelo WhatsApp (abre em nova aba)"
      tabIndex={hidden ? -1 : undefined}
      aria-hidden={hidden || undefined}
    >
      <WhatsAppIcon size={26} />
      <span className={styles.label}>WhatsApp</span>
    </a>
  );
}
