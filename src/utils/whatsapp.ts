import { formatBrazilianPhone, onlyDigits } from './phone';

/**
 * Monta o link oficial `https://wa.me/NUMERO?text=MENSAGEM`.
 *
 * Usamos encodeURIComponent em vez de URLSearchParams porque este último
 * codifica espaços como "+", e o WhatsApp nem sempre os converte de volta
 * em espaços. encodeURIComponent gera "%20" e "%0A" (quebra de linha),
 * que funcionam no app e no WhatsApp Web.
 */
export function buildWhatsAppUrl(number: string, message?: string): string {
  const digits = onlyDigits(number);
  const base = `https://wa.me/${digits}`;
  const text = message?.trim();
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export interface QuoteMessageData {
  name: string;
  phone: string; // DDD + número normalizado
  email?: string;
  subject?: string;
  date?: string; // AAAA-MM-DD
  quantity?: string;
  location?: string;
  details?: string;
}

/** Rótulos das linhas da mensagem: os mesmos dos campos do formulário, definidos no painel. */
export interface QuoteMessageLabels {
  subject: string;
  date: string;
  quantity: string;
  location: string;
  details: string;
}

export const DEFAULT_QUOTE_LABELS: QuoteMessageLabels = {
  subject: 'Assunto',
  date: 'Data',
  quantity: 'Quantidade',
  location: 'Local',
  details: 'Mensagem',
};

/** "2026-12-05" -> "05/12/2026" (sem passar por Date, evitando erro de fuso). */
export function formatIsoDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/** Mensagem do formulário formatada. Linhas de campos opcionais vazios são omitidas. */
export function buildQuoteMessage(data: QuoteMessageData, labels: QuoteMessageLabels = DEFAULT_QUOTE_LABELS): string {
  const lines: (string | false)[] = [
    'Olá! Vim pelo site e gostaria de solicitar um orçamento.',
    '',
    `Nome: ${data.name}`,
    `Contato: ${formatBrazilianPhone(data.phone)}`,
    !!data.email && `E-mail: ${data.email}`,
    !!data.subject && `${labels.subject}: ${data.subject}`,
    !!data.date && `${labels.date}: ${formatIsoDate(data.date)}`,
    !!data.quantity && `${labels.quantity}: ${data.quantity}`,
    !!data.location && `${labels.location}: ${data.location}`,
    !!data.details && `${labels.details}: ${data.details}`,
    '',
    'Poderiam me orientar sobre os próximos passos?',
  ];
  return lines.filter((l): l is string => l !== false).join('\n');
}
