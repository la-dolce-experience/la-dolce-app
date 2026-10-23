import { CheckCircle2, Info } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '../../components/Button/Button';
import { WhatsAppIcon } from '../../components/icons/WhatsAppIcon';
import { SectionHeading } from '../../components/SectionHeading/SectionHeading';
import { useSiteContent } from '../../hooks/useSiteContent';
import type { Section } from '../../types/content';
import { maskPhoneInput } from '../../utils/phone';
import { openExternal } from '../../utils/browser';
import { trackEvent } from '../../lib/metrics';
import { buildQuoteMessage, buildWhatsAppUrl } from '../../utils/whatsapp';
import { flag, formLabels, formSubjects } from '../site/sectionHelpers';
import { useQuoteIntent } from './QuoteIntentContext';
import {
  emptyQuoteForm,
  OTHER_SUBJECT,
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
  'subject',
  'date',
  'quantity',
  'location',
  'details',
];

/** Formulário que monta a mensagem e abre o WhatsApp. Os dados não ficam salvos no site. */
export function QuoteSection({ section }: { section: Section }) {
  const { content } = useSiteContent();
  const { settings } = content;
  const intent = useQuoteIntent();
  const labels = formLabels(section);
  const show = {
    date: flag(section, 'showDate'),
    quantity: flag(section, 'showQuantity'),
    location: flag(section, 'showLocation'),
  };

  const [values, setValues] = useState<QuoteFormValues>(emptyQuoteForm);
  const [errors, setErrors] = useState<QuoteFormErrors>({});
  const [sentUrl, setSentUrl] = useState<string | null>(null);
  const [coolingDown, setCoolingDown] = useState(false);
  const mountedAt = useRef(0);
  const [seenIntent, setSeenIntent] = useState(intent.version);
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Sem cartões com rótulo, o campo "Assunto" não aparece.
  const cardSubjects = formSubjects(content);
  const subjects = cardSubjects.length > 0 ? [...new Set([...cardSubjects, OTHER_SUBJECT])] : [];

  // Link "Pedir orçamento" de um cartão pré-seleciona o assunto
  // (ajuste de estado durante a renderização, sem efeito).
  if (intent.version !== seenIntent) {
    setSeenIntent(intent.version);
    if (intent.subject) {
      setValues((v) => ({ ...v, subject: intent.subject }));
      setErrors((e) => ({ ...e, subject: undefined }));
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

    // Campos desligados no painel não vão na mensagem, mesmo que tenham sobrado de outra configuração.
    const visibleValues: QuoteFormValues = {
      ...values,
      date: show.date ? values.date : '',
      quantity: show.quantity ? values.quantity : '',
      location: show.location ? values.location : '',
    };
    const result = validateQuoteForm(visibleValues, subjects);
    if (!result.ok) {
      setErrors(result.errors);
      setSentUrl(null);
      const first = FIELD_ORDER.find((f) => result.errors[f]);
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    const url = buildWhatsAppUrl(settings.whatsappNumber, buildQuoteMessage(result.data, labels));
    setErrors({});
    setSentUrl(url);
    setCoolingDown(true);
    openExternal(url);
    trackEvent('whatsapp_click', 'formulario');
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

  const optional = <span className={styles.optional}>(opcional)</span>;
  const errorCount = Object.values(errors).filter(Boolean).length;
  const headingId = `${section.slug}-title`;

  return (
    <section id={section.slug} className={styles.section} aria-labelledby={headingId}>
      <div className={`container ${styles.wrap}`}>
        <div className={styles.intro}>
          <SectionHeading id={headingId} eyebrow={section.eyebrow} title={section.title} body={section.body} />
          <ul className={styles.assurances}>
            <li>
              <CheckCircle2 aria-hidden="true" /> Só os campos com * são obrigatórios.
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
              <label htmlFor="quote-email">E-mail {optional}</label>
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

            {subjects.length > 0 && (
              <div className={`${styles.field} ${styles.full}`}>
                <label htmlFor="quote-subject">
                  {labels.subject} <span aria-hidden="true">*</span>
                </label>
                <select {...fieldProps('subject')} required>
                  <option value="">Selecione uma opção</option>
                  {subjects.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                {errorText('subject')}
              </div>
            )}

            {show.date && (
              <div className={styles.field}>
                <label htmlFor="quote-date">
                  {labels.date} {optional}
                </label>
                <input {...fieldProps('date')} type="date" min={todayIso()} />
                {errorText('date')}
              </div>
            )}

            {show.quantity && (
              <div className={styles.field}>
                <label htmlFor="quote-quantity">
                  {labels.quantity} {optional}
                </label>
                <input
                  {...fieldProps('quantity')}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={QUOTE_LIMITS.maxQuantity}
                />
                {errorText('quantity')}
              </div>
            )}

            {show.location && (
              <div className={`${styles.field} ${styles.full}`}>
                <label htmlFor="quote-location">
                  {labels.location} {optional}
                </label>
                <input
                  {...fieldProps('location')}
                  type="text"
                  autoComplete="address-level2"
                  maxLength={QUOTE_LIMITS.location}
                />
                {errorText('location')}
              </div>
            )}

            <div className={`${styles.field} ${styles.full}`}>
              <label htmlFor="quote-details">
                {labels.details} {optional}
              </label>
              <textarea {...fieldProps('details')} rows={4} maxLength={QUOTE_LIMITS.details} />
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
            {section.ctaLabel || 'Enviar pelo WhatsApp'}
          </Button>

          <p className={styles.disclaimer}>
            <Info aria-hidden="true" />
            Vamos abrir o WhatsApp com a mensagem pronta. Ela só chega até nós quando você tocar em
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
