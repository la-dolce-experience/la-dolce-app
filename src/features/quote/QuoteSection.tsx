import { CheckCircle2, Info } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '../../components/Button/Button';
import { WhatsAppIcon } from '../../components/icons/WhatsAppIcon';
import { SectionHeading } from '../../components/SectionHeading/SectionHeading';
import { useSiteContent } from '../../hooks/useSiteContent';
import { maskPhoneInput } from '../../utils/phone';
import { openExternal } from '../../utils/browser';
import { buildQuoteMessage, buildWhatsAppUrl } from '../../utils/whatsapp';
import { useQuoteIntent } from './QuoteIntentContext';
import {
  emptyQuoteForm,
  OTHER_EVENT_TYPE,
  QUOTE_LIMITS,
  todayIso,
  validateQuoteForm,
  type QuoteFormErrors,
  type QuoteFormValues,
} from './quoteForm';
import styles from './QuoteSection.module.css';

/** Tempo mínimo entre a renderização e o envio: bots costumam enviar instantaneamente. */
const MIN_FILL_MS = 1500;
/** Bloqueio após abrir o WhatsApp, evitando várias abas por clique duplo. */
const COOLDOWN_MS = 4000;

/** Campos com texto de ajuda (ligado via aria-describedby). */
const hints: Partial<Record<keyof QuoteFormValues, true>> = { details: true };

const FIELD_ORDER: (keyof QuoteFormValues)[] = [
  'name',
  'phone',
  'email',
  'eventType',
  'eventDate',
  'guests',
  'location',
  'details',
];

export function QuoteSection() {
  const { content } = useSiteContent();
  const section = content.sections.quote;
  const { settings } = content;
  const intent = useQuoteIntent();

  const [values, setValues] = useState<QuoteFormValues>(emptyQuoteForm);
  const [errors, setErrors] = useState<QuoteFormErrors>({});
  const [sentUrl, setSentUrl] = useState<string | null>(null);
  const [coolingDown, setCoolingDown] = useState(false);
  const mountedAt = useRef(0);
  const [seenIntent, setSeenIntent] = useState(intent.version);
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const eventOptions = [...new Set([...content.eventTypes.map((e) => e.formLabel), OTHER_EVENT_TYPE])];

  // Card "Pedir orçamento para ..." em outra seção pré-seleciona o tipo de evento
  // (ajuste de estado durante a renderização, sem efeito).
  if (intent.version !== seenIntent) {
    setSeenIntent(intent.version);
    if (intent.eventType) {
      setValues((v) => ({ ...v, eventType: intent.eventType }));
      setErrors((e) => ({ ...e, eventType: undefined }));
    }
  }

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (!coolingDown) return;
    const t = setTimeout(() => setCoolingDown(false), COOLDOWN_MS);
    return () => clearTimeout(t);
  }, [coolingDown]);

  if (!section.visible) return null;

  function update(field: keyof QuoteFormValues) {
    return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const raw = e.target.value;
      const value = field === 'phone' ? maskPhoneInput(raw) : raw;
      setValues((v) => ({ ...v, [field]: value }));
      if (errors[field]) setErrors((err) => ({ ...err, [field]: undefined }));
    };
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (coolingDown) return;

    // Honeypot preenchido: provável bot. Não abre nada e não revela o motivo.
    if (values.website) return;

    if (Date.now() - mountedAt.current < MIN_FILL_MS) {
      setErrors({ name: 'Confira os dados e tente novamente.' });
      return;
    }

    const result = validateQuoteForm(values, eventOptions);
    if (!result.ok) {
      setErrors(result.errors);
      setSentUrl(null);
      const first = FIELD_ORDER.find((f) => result.errors[f]);
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    const url = buildWhatsAppUrl(settings.whatsappNumber, buildQuoteMessage(result.data));
    setErrors({});
    setSentUrl(url);
    setCoolingDown(true);
    openExternal(url);
    requestAnimationFrame(() => statusRef.current?.focus());
  }

  const fieldProps = (field: keyof QuoteFormValues) => ({
    id: `quote-${field}`,
    name: field,
    value: values[field],
    onChange: update(field),
    'aria-invalid': errors[field] ? true : undefined,
    'aria-describedby':
      [errors[field] && `quote-${field}-error`, hints[field] && `quote-${field}-hint`].filter(Boolean).join(' ') ||
      undefined,
  });

  const errorText = (field: keyof QuoteFormValues) =>
    errors[field] ? (
      <p id={`quote-${field}-error`} className={styles.error}>
        {errors[field]}
      </p>
    ) : null;

  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <section id="orcamento" className={styles.section} aria-labelledby="quote-title">
      <div className={`container ${styles.wrap}`}>
        <div className={styles.intro}>
          <SectionHeading id="quote-title" eyebrow={section.eyebrow} title={section.title} body={section.body} />
          <ul className={styles.assurances}>
            <li>
              <CheckCircle2 aria-hidden="true" /> Só nome, WhatsApp e tipo de evento são obrigatórios.
            </li>
            <li>
              <CheckCircle2 aria-hidden="true" /> Você revisa a mensagem antes de enviar.
            </li>
            <li>
              <CheckCircle2 aria-hidden="true" /> Os dados não ficam salvos no site: vão direto para a conversa.
            </li>
          </ul>
        </div>

        <form
          ref={formRef}
          className={styles.form}
          onSubmit={handleSubmit}
          noValidate
          aria-describedby="quote-required-note"
        >
          <p id="quote-required-note" className={styles.requiredNote}>
            Campos com <span aria-hidden="true">*</span>
            <span className="visually-hidden">asterisco</span> são obrigatórios.
          </p>

          {errorCount > 0 && (
            <div className={styles.errorSummary} role="alert">
              {errorCount === 1 ? 'Corrija o campo destacado.' : `Corrija os ${errorCount} campos destacados.`}
            </div>
          )}

          <div className={styles.grid}>
            <div className={`${styles.field} ${styles.full}`}>
              <label htmlFor="quote-name">
                Nome <span aria-hidden="true">*</span>
              </label>
              <input {...fieldProps('name')} type="text" autoComplete="name" maxLength={QUOTE_LIMITS.name} required />
              {errorText('name')}
            </div>

            <div className={styles.field}>
              <label htmlFor="quote-phone">
                WhatsApp para retorno <span aria-hidden="true">*</span>
              </label>
              <input
                {...fieldProps('phone')}
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="(11) 99999-9999"
                required
              />
              {errorText('phone')}
            </div>

            <div className={styles.field}>
              <label htmlFor="quote-email">
                E-mail <span className={styles.optional}>(opcional)</span>
              </label>
              <input
                {...fieldProps('email')}
                type="email"
                inputMode="email"
                autoComplete="email"
                maxLength={QUOTE_LIMITS.email}
                placeholder="seuemail@exemplo.com"
              />
              {errorText('email')}
            </div>

            <div className={`${styles.field} ${styles.full}`}>
              <label htmlFor="quote-eventType">
                Tipo de evento <span aria-hidden="true">*</span>
              </label>
              <select {...fieldProps('eventType')} required>
                <option value="">Selecione uma opção</option>
                {eventOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {errorText('eventType')}
            </div>

            <div className={styles.field}>
              <label htmlFor="quote-eventDate">
                Data prevista <span className={styles.optional}>(opcional)</span>
              </label>
              <input {...fieldProps('eventDate')} type="date" min={todayIso()} />
              {errorText('eventDate')}
            </div>

            <div className={styles.field}>
              <label htmlFor="quote-guests">
                Nº estimado de convidados <span className={styles.optional}>(opcional)</span>
              </label>
              <input
                {...fieldProps('guests')}
                type="number"
                inputMode="numeric"
                min={1}
                max={QUOTE_LIMITS.maxGuests}
                placeholder="Ex.: 120"
              />
              {errorText('guests')}
            </div>

            <div className={`${styles.field} ${styles.full}`}>
              <label htmlFor="quote-location">
                Cidade ou local do evento <span className={styles.optional}>(opcional)</span>
              </label>
              <input
                {...fieldProps('location')}
                type="text"
                autoComplete="address-level2"
                maxLength={QUOTE_LIMITS.location}
                placeholder="Ex.: Pinheiros, São Paulo"
              />
              {errorText('location')}
            </div>

            <div className={`${styles.field} ${styles.full}`}>
              <label htmlFor="quote-details">
                Conte um pouco sobre o evento <span className={styles.optional}>(opcional)</span>
              </label>
              <textarea
                {...fieldProps('details')}
                rows={4}
                maxLength={QUOTE_LIMITS.details}
                placeholder="Horário, tipo de público, ideia de personalização..."
              />
              <p id="quote-details-hint" className={styles.hint}>
                {values.details.length}/{QUOTE_LIMITS.details} caracteres
              </p>
              {errorText('details')}
            </div>
          </div>

          {/* Honeypot anti-spam: invisível para pessoas, ignorado por leitores de tela. */}
          <div className={styles.honeypot} aria-hidden="true">
            <label htmlFor="quote-website">Não preencha este campo</label>
            <input
              id="quote-website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={values.website}
              onChange={update('website')}
            />
          </div>

          <Button type="submit" size="lg" block icon={<WhatsAppIcon />} disabled={coolingDown}>
            {section.ctaLabel || 'Solicitar orçamento pelo WhatsApp'}
          </Button>

          <p className={styles.disclaimer}>
            <Info aria-hidden="true" />
            Vamos abrir o WhatsApp com a mensagem pronta. O pedido só chega até nós quando você tocar em
            <strong> Enviar</strong> na conversa.
          </p>

          {sentUrl && (
            <div ref={statusRef} tabIndex={-1} role="status" className={styles.success}>
              <strong>Abrimos o WhatsApp com a sua mensagem.</strong>
              <span>
                Para concluir, confira os dados e toque em Enviar. A conversa não abriu?{' '}
                <a href={sentUrl} target="_blank" rel="noopener noreferrer">
                  Abrir o WhatsApp novamente
                </a>
                .
              </span>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
