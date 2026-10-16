import { ChevronDown, CircleHelp, Mail, MessageCircle, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { SUPPORT_EMAIL, SUPPORT_NAME, SUPPORT_WHATSAPP } from '../../../lib/env';
import { buildWhatsAppUrl } from '../../../utils/whatsapp';
import a from '../admin.module.css';

const SUPPORT_MESSAGE = 'Olá! Preciso de ajuda com o painel do site La Dolce Experience.';
const SUPPORT_SUBJECT = 'Ajuda com o painel — La Dolce Experience';

interface Props {
  onOpenGuide: () => void;
  /** O tour navega entre telas: com alterações não salvas, ele fica indisponível. */
  guideDisabled?: boolean;
}

/** Menu "Ajuda" da barra lateral: refazer o tour do painel ou falar com o suporte técnico. */
export function HelpMenu({ onOpenGuide, guideDisabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const who = SUPPORT_NAME || 'o suporte';

  return (
    <div className={a.help} data-tour="help">
      <button type="button" aria-expanded={open} aria-controls="help-menu" onClick={() => setOpen((v) => !v)}>
        <CircleHelp aria-hidden="true" width={18} height={18} /> Ajuda
        <ChevronDown aria-hidden="true" width={16} height={16} className={open ? a.chevronOpen : a.chevron} />
      </button>
      {open && (
        <ul id="help-menu" className={a.helpMenu}>
          <li>
            <button
              type="button"
              disabled={guideDisabled}
              aria-describedby={guideDisabled ? 'help-guide-note' : undefined}
              onClick={() => {
                setOpen(false);
                onOpenGuide();
              }}
            >
              <RotateCcw aria-hidden="true" width={16} height={16} /> Refazer o tour do painel
            </button>
            {guideDisabled && (
              <p id="help-guide-note" className={a.helpNote}>
                Salve ou descarte as alterações antes de refazer o tour.
              </p>
            )}
          </li>
          {SUPPORT_WHATSAPP && (
            <li>
              <a
                className={a.navLink}
                href={buildWhatsAppUrl(SUPPORT_WHATSAPP, SUPPORT_MESSAGE)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle aria-hidden="true" /> Falar com {who} no WhatsApp
              </a>
            </li>
          )}
          {SUPPORT_EMAIL && (
            <li>
              <a className={a.navLink} href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(SUPPORT_SUBJECT)}`}>
                <Mail aria-hidden="true" /> Enviar e-mail para {who}
              </a>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
