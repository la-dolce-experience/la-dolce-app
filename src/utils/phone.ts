export const onlyDigits = (value: string) => value.replace(/\D/g, '');

/**
 * Normaliza um telefone brasileiro digitado pelo visitante.
 * Aceita "(11) 99999-9999", "+55 11 99999-9999", "11999999999" etc.
 * Retorna DDD + número (10 ou 11 dígitos) ou null se inválido.
 */
export function normalizeBrazilianPhone(value: string): string | null {
  let digits = onlyDigits(value);
  if (digits.length >= 12 && digits.startsWith('55')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1); // 0 de discagem
  if (digits.length !== 10 && digits.length !== 11) return null;
  const ddd = Number(digits.slice(0, 2));
  if (ddd < 11 || ddd > 99) return null;
  // Celular (11 dígitos) começa com 9.
  if (digits.length === 11 && digits[2] !== '9') return null;
  return digits;
}

/** Formata DDD + número para exibição: (11) 99999-9999 / (11) 3333-4444 */
export function formatBrazilianPhone(digits: string): string {
  const d = onlyDigits(digits);
  const local = d.length >= 12 && d.startsWith('55') ? d.slice(2) : d;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return digits;
}

/** Máscara progressiva para o campo de telefone enquanto o usuário digita. */
export function maskPhoneInput(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Valida o número comercial configurado no admin (DDI + DDD + número, só dígitos). */
export function isValidWhatsappNumber(value: string): boolean {
  return /^[1-9]\d{9,14}$/.test(value);
}
