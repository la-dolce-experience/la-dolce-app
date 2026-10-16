import { formatBrazilianPhone, isValidWhatsappNumber, maskPhoneInput, normalizeBrazilianPhone } from './phone';

describe('normalizeBrazilianPhone', () => {
  it.each([
    ['(11) 98765-4321', '11987654321'],
    ['+55 11 98765-4321', '11987654321'],
    ['5511987654321', '11987654321'],
    ['011 3333-4444', '1133334444'],
    ['11 3333 4444', '1133334444'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizeBrazilianPhone(input)).toBe(expected);
  });

  it.each(['', '1234', '(00) 98765-4321', '11 88765-43210', '(11) 88765-4321', 'abc'])('rejeita "%s"', (input) => {
    expect(normalizeBrazilianPhone(input)).toBeNull();
  });
});

describe('formatação', () => {
  it('formata celular e fixo', () => {
    expect(formatBrazilianPhone('11987654321')).toBe('(11) 98765-4321');
    expect(formatBrazilianPhone('1133334444')).toBe('(11) 3333-4444');
    expect(formatBrazilianPhone('5511920102743')).toBe('(11) 92010-2743');
  });

  it('aplica máscara progressiva', () => {
    expect(maskPhoneInput('1')).toBe('(1');
    expect(maskPhoneInput('1198')).toBe('(11) 98');
    expect(maskPhoneInput('1133334444')).toBe('(11) 3333-4444');
    expect(maskPhoneInput('11987654321999')).toBe('(11) 98765-4321');
  });
});

describe('isValidWhatsappNumber', () => {
  it('exige apenas dígitos com DDI', () => {
    expect(isValidWhatsappNumber('5511920102743')).toBe(true);
    expect(isValidWhatsappNumber('+5511920102743')).toBe(false);
    expect(isValidWhatsappNumber('123')).toBe(false);
  });
});
