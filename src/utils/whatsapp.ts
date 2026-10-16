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
  eventType: string;
  eventDate?: string; // AAAA-MM-DD
  guests?: string;
  location?: string;
  details?: string;
}

/** "2026-12-05" -> "05/12/2026" (sem passar por Date, evitando erro de fuso). */
export function formatIsoDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/** Mensagem de orçamento formatada. Linhas de campos opcionais vazios são omitidas. */
export function buildQuoteMessage(data: QuoteMessageData): string {
  const lines: (string | false)[] = [
    'Olá! Vim pelo site e gostaria de solicitar um orçamento.',
    '',
    `Nome: ${data.name}`,
    `Contato: ${formatBrazilianPhone(data.phone)}`,
    !!data.email && `E-mail: ${data.email}`,
    `Tipo de evento: ${data.eventType}`,
    !!data.eventDate && `Data do evento: ${formatIsoDate(data.eventDate)}`,
    !!data.guests && `Convidados (estimativa): ${data.guests}`,
    !!data.location && `Local: ${data.location}`,
    !!data.details && `Descrição: ${data.details}`,
    '',
    'Poderiam me orientar sobre os próximos passos?',
  ];
  return lines.filter((l): l is string => l !== false).join('\n');
}
