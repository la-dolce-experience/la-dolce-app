import { normalizeBrazilianPhone } from '../../utils/phone';
import type { QuoteMessageData } from '../../utils/whatsapp';

export interface QuoteFormValues {
  name: string;
  phone: string;
  email: string;
  /** Assunto escolhido entre os cartões (ver formSubjects). */
  subject: string;
  date: string;
  quantity: string;
  location: string;
  details: string;
  /** Honeypot: campo invisível que pessoas reais não preenchem. */
  website: string;
}

export type QuoteFormErrors = Partial<Record<keyof QuoteFormValues, string>>;

export const emptyQuoteForm: QuoteFormValues = {
  name: '',
  phone: '',
  email: '',
  subject: '',
  date: '',
  quantity: '',
  location: '',
  details: '',
  website: '',
};

/** Opção sempre presente no campo "Assunto" quando ele aparece. */
export const OTHER_SUBJECT = 'Outros';

export const QUOTE_LIMITS = {
  name: 80,
  email: 120,
  location: 120,
  details: 1000,
  maxQuantity: 100000,
} as const;

/** Remove caracteres de controle (exceto quebra de linha) e espaços repetidos. */
export function sanitizeText(value: string, { multiline = false } = {}): string {
  // eslint-disable-next-line no-control-regex
  const noControl = value.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '');
  if (multiline) {
    return noControl
      .split('\n')
      .map((l) => l.replace(/[ \t]+/g, ' ').trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
  return noControl.replace(/\s+/g, ' ').trim();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Data local de hoje em AAAA-MM-DD (para comparar com o <input type="date">). */
export function todayIso(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

export type QuoteValidation = { ok: true; data: QuoteMessageData } | { ok: false; errors: QuoteFormErrors };

/**
 * Valida o formulário. `subjects` são as opções do campo "Assunto": sem opções, o campo não aparece
 * e não é obrigatório. Campos opcionais só são validados quando preenchidos.
 */
export function validateQuoteForm(values: QuoteFormValues, subjects: string[], now = new Date()): QuoteValidation {
  const errors: QuoteFormErrors = {};
  const name = sanitizeText(values.name);
  const email = sanitizeText(values.email).toLowerCase();
  const location = sanitizeText(values.location);
  const details = sanitizeText(values.details, { multiline: true });
  const quantity = values.quantity.trim();

  if (name.length < 2) errors.name = 'Informe seu nome.';
  else if (name.length > QUOTE_LIMITS.name) errors.name = `Use no máximo ${QUOTE_LIMITS.name} caracteres.`;

  const phone = normalizeBrazilianPhone(values.phone);
  if (!values.phone.trim()) errors.phone = 'Informe um WhatsApp para retorno.';
  else if (!phone) errors.phone = 'Número inválido. Use DDD + número, ex.: (11) 99999-9999.';

  if (email && (!EMAIL_RE.test(email) || email.length > QUOTE_LIMITS.email)) {
    errors.email = 'E-mail inválido. Deixe em branco se preferir.';
  }

  if (subjects.length > 0) {
    if (!values.subject) errors.subject = 'Selecione uma opção.';
    else if (!subjects.includes(values.subject)) errors.subject = 'Selecione uma opção da lista.';
  }

  if (values.date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date)) errors.date = 'Data inválida.';
    else if (values.date < todayIso(now)) errors.date = 'Essa data já passou.';
  }

  if (quantity) {
    const n = Number(quantity);
    if (!Number.isInteger(n) || n < 1 || n > QUOTE_LIMITS.maxQuantity) {
      errors.quantity = 'Informe um número inteiro (ex.: 120).';
    }
  }

  if (location.length > QUOTE_LIMITS.location) errors.location = `Use no máximo ${QUOTE_LIMITS.location} caracteres.`;
  if (details.length > QUOTE_LIMITS.details) errors.details = `Use no máximo ${QUOTE_LIMITS.details} caracteres.`;

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      name,
      phone: phone!,
      email: email || undefined,
      subject: subjects.length > 0 ? values.subject : undefined,
      date: values.date || undefined,
      quantity: quantity ? String(Number(quantity)) : undefined,
      location: location || undefined,
      details: details || undefined,
    },
  };
}
