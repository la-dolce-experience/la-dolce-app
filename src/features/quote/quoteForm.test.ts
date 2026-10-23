import { emptyQuoteForm, sanitizeText, todayIso, validateQuoteForm, type QuoteFormValues } from './quoteForm';

const OPTIONS = ['Serviço 1', 'Serviço 2', 'Outros'];
const NOW = new Date(2026, 9, 16, 12, 0); // 16/10/2026

const valid = (patch: Partial<QuoteFormValues> = {}): QuoteFormValues => ({
  ...emptyQuoteForm,
  name: 'Ana',
  phone: '(11) 98765-4321',
  subject: 'Serviço 2',
  ...patch,
});

describe('validateQuoteForm', () => {
  it('aceita somente os obrigatórios e normaliza o telefone', () => {
    const result = validateQuoteForm(valid(), OPTIONS, NOW);
    expect(result).toEqual({
      ok: true,
      data: {
        name: 'Ana',
        phone: '11987654321',
        email: undefined,
        subject: 'Serviço 2',
        date: undefined,
        quantity: undefined,
        location: undefined,
        details: undefined,
      },
    });
  });

  it('acusa todos os obrigatórios ausentes', () => {
    const result = validateQuoteForm(emptyQuoteForm, OPTIONS, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(['name', 'phone', 'subject']);
  });

  it('valida campos opcionais apenas quando preenchidos', () => {
    const result = validateQuoteForm(
      valid({ email: 'ana@', date: '2026-10-15', quantity: '1.5', details: 'x'.repeat(1001) }),
      OPTIONS,
      NOW,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.email).toMatch(/inválido/);
      expect(result.errors.date).toMatch(/já passou/);
      expect(result.errors.quantity).toBeDefined();
      expect(result.errors.details).toMatch(/1000/);
    }
  });

  it('aceita a data de hoje', () => {
    expect(validateQuoteForm(valid({ date: todayIso(NOW) }), OPTIONS, NOW).ok).toBe(true);
  });

  it('recusa assunto fora da lista (manipulação do HTML)', () => {
    const result = validateQuoteForm(valid({ subject: '<script>' }), OPTIONS, NOW);
    expect(result.ok).toBe(false);
  });

  it('sem opções de assunto, o campo não é obrigatório nem vai na mensagem', () => {
    const result = validateQuoteForm(valid({ subject: '' }), [], NOW);
    expect(result.ok && result.data.subject).toBeUndefined();
  });

  it('limpa espaços, caracteres de controle e normaliza a quantidade', () => {
    const result = validateQuoteForm(
      valid({ name: '  Ana\u0007   Souza ', email: ' ANA@Exemplo.COM ', quantity: '0120', details: ' a \n\n\n\n b ' }),
      OPTIONS,
      NOW,
    );
    expect(result.ok && result.data).toMatchObject({
      name: 'Ana Souza',
      email: 'ana@exemplo.com',
      quantity: '120',
      details: 'a\n\nb',
    });
  });
});

describe('sanitizeText', () => {
  it('mantém quebras de linha apenas no modo multilinha', () => {
    expect(sanitizeText('a\nb')).toBe('a b');
    expect(sanitizeText('a\nb', { multiline: true })).toBe('a\nb');
  });
});
