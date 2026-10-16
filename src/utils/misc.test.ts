import { defaultContent } from '../content/defaultContent';
import { validateNewPassword, nextLockState, LOGIN_LOCK } from '../features/admin/auth/password';
import { normalizeSettings, validateSettings, type SettingsForm } from '../features/admin/settingsValidation';
import { toFriendlyError } from '../services/errors';
import { fitInside, validateImageFile } from './imageProcessing';
import { addressLines, mapsEmbedUrl, mapsLink, safeExternalUrl } from './location';
import { buildStructuredData } from './structuredData';

const settings = defaultContent.settings;

describe('localização', () => {
  it('sem endereço físico: sem linhas, sem link e sem mapa', () => {
    expect(addressLines(settings)).toEqual([]);
    expect(mapsLink(settings)).toBeNull();
    expect(mapsEmbedUrl({ ...settings, showMap: true })).toBeNull();
  });

  it('com endereço: formata, gera link do Maps e mapa somente se habilitado', () => {
    const s = { ...settings, addressStreet: 'Rua A, 10', addressDistrict: 'Centro', postalCode: '01001000' };
    expect(addressLines(s)).toEqual(['Rua A, 10, Centro', 'São Paulo - SP · CEP 01001-000']);
    expect(mapsLink(s)).toMatch(/^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=Rua%20A/);
    expect(mapsEmbedUrl(s)).toBeNull();
    expect(mapsEmbedUrl({ ...s, showMap: true })).toContain('output=embed');
  });

  it('safeExternalUrl bloqueia protocolos perigosos', () => {
    expect(safeExternalUrl('javascript:alert(1)')).toBeNull();
    expect(safeExternalUrl('http://inseguro.com')).toBeNull();
    expect(safeExternalUrl('https://instagram.com/ladolce')).toBe('https://instagram.com/ladolce');
  });
});

describe('imagens', () => {
  it('valida tipo e tamanho', () => {
    expect(validateImageFile({ name: 'a.gif', type: 'image/gif', size: 100 })).toMatch(/Formato/);
    expect(validateImageFile({ name: 'a.jpg', type: 'image/jpeg', size: 11 * 1024 * 1024 })).toMatch(/10 MB/);
    expect(validateImageFile({ name: 'a.png', type: 'image/png', size: 0 })).toMatch(/vazio/);
    expect(validateImageFile({ name: 'a.webp', type: 'image/webp', size: 2048 })).toBeNull();
    // Fotos do iPhone: pelo tipo ou, quando o navegador não informa o tipo, pela extensão.
    expect(validateImageFile({ name: 'IMG_0001.HEIC', type: 'image/heic', size: 2048 })).toBeNull();
    expect(validateImageFile({ name: 'IMG_0002.heic', type: '', size: 2048 })).toBeNull();
    expect(validateImageFile({ name: 'foto.heif', type: '', size: 2048 })).toBeNull();
    expect(validateImageFile({ name: 'arquivo', type: '', size: 2048 })).toMatch(/Formato/);
  });

  it('redimensiona sem ampliar e mantendo a proporção', () => {
    expect(fitInside(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(fitInside(760, 2048, 800)).toEqual({ width: 297, height: 800 });
    expect(fitInside(500, 400, 1600)).toEqual({ width: 500, height: 400 });
  });
});

describe('configurações do painel', () => {
  const base: SettingsForm = {
    business_name: 'La Dolce Experience',
    footer_tagline: '',
    whatsapp_number: '+55 (11) 92010-2743',
    whatsapp_greeting: 'Olá!',
    phone: '',
    email: '',
    instagram_url: '',
    facebook_url: '',
    tiktok_url: '',
    address_street: '',
    address_district: '',
    city: 'São Paulo',
    state: 'sp',
    postal_code: '01001-000',
    service_area: '',
    opening_hours: '',
    maps_url: '',
    show_map: false,
    seo_title: 'Título',
    seo_description: 'Descrição',
    logo_media_id: null,
    og_media_id: null,
  };
  const all = Object.keys(base) as (keyof SettingsForm)[];

  it('normaliza WhatsApp, UF e CEP', () => {
    const n = normalizeSettings(base);
    expect(n.whatsapp_number).toBe('5511920102743');
    expect(n.state).toBe('SP');
    expect(n.postal_code).toBe('01001000');
    expect(validateSettings(n, all)).toEqual({});
  });

  it('adiciona DDI 55 quando o número é digitado só com DDD', () => {
    expect(normalizeSettings({ ...base, whatsapp_number: '(11) 92010-2743' }).whatsapp_number).toBe('5511920102743');
  });

  it('rejeita links não https, e-mail inválido e mapa sem endereço', () => {
    const errors = validateSettings(
      normalizeSettings({
        ...base,
        instagram_url: 'javascript:alert(1)',
        maps_url: 'http://maps.com',
        email: 'x@',
        show_map: true,
      }),
      all,
    );
    expect(Object.keys(errors).sort()).toEqual(['email', 'instagram_url', 'maps_url', 'show_map']);
  });

  it('valida somente os campos da tela atual', () => {
    expect(validateSettings({ ...base, email: 'x@' }, ['seo_title'])).toEqual({});
  });
});

describe('senha e bloqueio de login', () => {
  it('aplica a política de senha', () => {
    expect(validateNewPassword('curta', 'curta')).toMatch(/10/);
    expect(validateNewPassword('semnumeroAAAA', 'semnumeroAAAA')).toMatch(/maiúsculas/);
    expect(validateNewPassword('Valida12345', 'Outra12345')).toMatch(/não conferem/);
    expect(validateNewPassword('Valida12345', 'Valida12345')).toBeNull();
  });

  it('bloqueia após tentativas seguidas', () => {
    let state = { failures: 0, lockedUntil: 0 };
    for (let i = 0; i < LOGIN_LOCK.maxAttempts - 1; i++) state = nextLockState(state.failures, 1000);
    expect(state.lockedUntil).toBe(0);
    state = nextLockState(state.failures, 1000);
    expect(state.lockedUntil).toBe(1000 + LOGIN_LOCK.lockMs);
  });
});

describe('mensagens de erro', () => {
  it.each([
    [{ message: 'Invalid login credentials' }, /incorretos/],
    [{ message: 'new row violates row-level security policy', code: '42501' }, /permissão/],
    [{ message: 'violates check constraint', code: '23514' }, /formato inválido/],
    [new TypeError('Failed to fetch'), /conectar/],
    [{ message: 'x', status: 429 }, /Muitas tentativas/],
    [{ message: 'algo estranho' }, /Algo deu errado/],
  ])('%o', (error, expected) => {
    expect(toFriendlyError(error)).toMatch(expected);
  });
});

describe('dados estruturados', () => {
  it('não inclui endereço quando não há local físico', () => {
    const data = buildStructuredData(defaultContent, 'https://exemplo.com');
    expect(data['@type']).toBe('IceCreamShop');
    expect(data.telephone).toBe('+5511920102743');
    expect('address' in data).toBe(false);
    expect(data.image).toBe('https://exemplo.com/images/og-la-dolce.jpg');
  });
});
