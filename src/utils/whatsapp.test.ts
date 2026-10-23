import { buildQuoteMessage, buildWhatsAppUrl, formatIsoDate } from './whatsapp';

// searchParams.get já decodifica o valor.
const decode = (url: string) => new URL(url).searchParams.get('text') ?? '';

describe('buildWhatsAppUrl', () => {
  it('usa o link oficial wa.me apenas com dígitos', () => {
    expect(buildWhatsAppUrl('+55 (11) 92010-2743')).toBe('https://wa.me/5511920102743');
  });

  it('codifica a mensagem inicial do botão flutuante', () => {
    const url = buildWhatsAppUrl('5511920102743', 'Olá! Vim pelo site e quero tirar algumas dúvidas.');
    expect(url).toBe(
      'https://wa.me/5511920102743?text=Ol%C3%A1!%20Vim%20pelo%20site%20e%20quero%20tirar%20algumas%20d%C3%BAvidas.',
    );
    expect(decode(url)).toBe('Olá! Vim pelo site e quero tirar algumas dúvidas.');
  });

  it('codifica espaços como %20 (não "+") e quebras de linha como %0A', () => {
    const url = buildWhatsAppUrl('5511920102743', 'linha 1\nlinha 2');
    expect(url).toContain('linha%201%0Alinha%202');
    expect(url).not.toContain('+');
  });

  it('preserva caracteres especiais e emoji sem quebrar a URL', () => {
    const text = 'Festa & bolo: 50% #1 ?=/ 🍦 "aspas" çãõ';
    const url = buildWhatsAppUrl('5511920102743', text);
    expect(url.split('?text=')[1]).not.toMatch(/[&#\s?]/);
    expect(decode(url)).toBe(text);
  });

  it('omite o parâmetro text quando não há mensagem', () => {
    expect(buildWhatsAppUrl('5511920102743', '   ')).toBe('https://wa.me/5511920102743');
  });
});

describe('buildQuoteMessage', () => {
  it('monta a mensagem completa no formato combinado', () => {
    const message = buildQuoteMessage({
      name: 'Ana Souza',
      phone: '11987654321',
      email: 'ana@exemplo.com',
      subject: 'Serviço 1',
      date: '2026-12-05',
      quantity: '120',
      location: 'Pinheiros, São Paulo',
      details: 'Primeira linha.\nSegunda linha.',
    });
    expect(message).toBe(
      [
        'Olá! Vim pelo site e gostaria de solicitar um orçamento.',
        '',
        'Nome: Ana Souza',
        'Contato: (11) 98765-4321',
        'E-mail: ana@exemplo.com',
        'Assunto: Serviço 1',
        'Data: 05/12/2026',
        'Quantidade: 120',
        'Local: Pinheiros, São Paulo',
        'Mensagem: Primeira linha.\nSegunda linha.',
        '',
        'Poderiam me orientar sobre os próximos passos?',
      ].join('\n'),
    );
  });

  it('omite linhas de campos opcionais vazios', () => {
    const message = buildQuoteMessage({ name: 'João', phone: '1133334444' });
    expect(message).not.toMatch(/E-mail|Assunto|Data|Quantidade|Local|Mensagem/);
    expect(message).toContain('Contato: (11) 3333-4444');
  });

  it('usa os rótulos definidos no painel', () => {
    const message = buildQuoteMessage(
      { name: 'Ana', phone: '11987654321', subject: 'Casamento', quantity: '80' },
      {
        subject: 'Tipo de evento',
        date: 'Data do evento',
        quantity: 'Convidados',
        location: 'Local',
        details: 'Detalhes',
      },
    );
    expect(message).toContain('Tipo de evento: Casamento');
    expect(message).toContain('Convidados: 80');
  });

  it('sobrevive à codificação de URL com acentos e quebras de linha', () => {
    const message = buildQuoteMessage({ name: 'Zé Ção', phone: '11987654321', subject: 'Feira ou exposição' });
    expect(decode(buildWhatsAppUrl('5511920102743', message))).toBe(message);
  });
});

describe('formatIsoDate', () => {
  it('converte sem sofrer com fuso horário', () => {
    expect(formatIsoDate('2026-01-01')).toBe('01/01/2026');
  });
});
