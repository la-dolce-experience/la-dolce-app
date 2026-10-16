import type { SettingsRow } from '../../services/adminService';
import { isValidWhatsappNumber, onlyDigits } from '../../utils/phone';

export interface SettingsForm {
  business_name: string;
  footer_tagline: string;
  whatsapp_number: string;
  whatsapp_greeting: string;
  phone: string;
  email: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
  address_street: string;
  address_district: string;
  city: string;
  state: string;
  postal_code: string;
  service_area: string;
  opening_hours: string;
  maps_url: string;
  show_map: boolean;
  seo_title: string;
  seo_description: string;
  logo_media_id: string | null;
  og_media_id: string | null;
}

export type SettingsErrors = Partial<Record<keyof SettingsForm, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === 'https:' && !/[\s<>"]/.test(value);
  } catch {
    return false;
  }
}

/** Normaliza o que o cliente digitou (remove máscara, espaços, padroniza UF). */
export function normalizeSettings(v: SettingsForm): SettingsForm {
  const t = (s: string) => s.trim();
  let whatsapp = onlyDigits(v.whatsapp_number);
  // Número brasileiro digitado sem DDI (10–11 dígitos): adiciona 55.
  if (whatsapp.length === 10 || whatsapp.length === 11) whatsapp = `55${whatsapp}`;
  let phone = onlyDigits(v.phone);
  if (phone.length >= 12 && phone.startsWith('55')) phone = phone.slice(2);
  return {
    ...v,
    business_name: t(v.business_name),
    footer_tagline: t(v.footer_tagline),
    whatsapp_number: whatsapp,
    whatsapp_greeting: t(v.whatsapp_greeting),
    phone,
    email: t(v.email).toLowerCase(),
    instagram_url: t(v.instagram_url),
    facebook_url: t(v.facebook_url),
    tiktok_url: t(v.tiktok_url),
    address_street: t(v.address_street),
    address_district: t(v.address_district),
    city: t(v.city),
    state: t(v.state).toUpperCase(),
    postal_code: onlyDigits(v.postal_code),
    service_area: t(v.service_area),
    opening_hours: t(v.opening_hours),
    maps_url: t(v.maps_url),
    seo_title: t(v.seo_title),
    seo_description: t(v.seo_description),
  };
}

/** Valida os campos indicados (cada página do painel edita um subconjunto). */
export function validateSettings(v: SettingsForm, fields: (keyof SettingsForm)[]): SettingsErrors {
  const e: SettingsErrors = {};
  const has = (f: keyof SettingsForm) => fields.includes(f);

  if (has('business_name') && !v.business_name) e.business_name = 'Informe o nome do negócio.';
  if (has('whatsapp_number') && !isValidWhatsappNumber(v.whatsapp_number)) {
    e.whatsapp_number = 'Número inválido. Use DDI + DDD + número, ex.: 55 11 92010-2743.';
  }
  if (has('whatsapp_greeting') && !v.whatsapp_greeting) e.whatsapp_greeting = 'Informe a mensagem inicial.';
  if (has('phone') && v.phone && (v.phone.length < 10 || v.phone.length > 11)) {
    e.phone = 'Telefone inválido. Use DDD + número.';
  }
  if (has('email') && v.email && !EMAIL_RE.test(v.email)) e.email = 'E-mail inválido.';
  for (const f of ['instagram_url', 'facebook_url', 'tiktok_url', 'maps_url'] as const) {
    if (has(f) && v[f] && !isHttpsUrl(v[f])) e[f] = 'Cole o link completo, começando com https://';
  }
  if (has('state') && v.state && !/^[A-Z]{2}$/.test(v.state)) e.state = 'Use a sigla com 2 letras, ex.: SP.';
  if (has('postal_code') && v.postal_code && v.postal_code.length !== 8) e.postal_code = 'O CEP deve ter 8 dígitos.';
  if (has('show_map') && v.show_map && !v.address_street) {
    e.show_map = 'Para exibir o mapa, preencha o endereço.';
  }
  if (has('seo_title')) {
    if (!v.seo_title) e.seo_title = 'Informe o título da página.';
    else if (v.seo_title.length > 70) e.seo_title = 'Use no máximo 70 caracteres.';
  }
  if (has('seo_description')) {
    if (!v.seo_description) e.seo_description = 'Informe a descrição.';
    else if (v.seo_description.length > 170) e.seo_description = 'Use no máximo 170 caracteres.';
  }
  return e;
}

/** Linha do banco -> valores do formulário. */
export function rowToForm(row: SettingsRow): SettingsForm {
  return {
    business_name: row.business_name,
    footer_tagline: row.footer_tagline,
    whatsapp_number: row.whatsapp_number,
    whatsapp_greeting: row.whatsapp_greeting,
    phone: row.phone,
    email: row.email,
    instagram_url: row.instagram_url,
    facebook_url: row.facebook_url,
    tiktok_url: row.tiktok_url,
    address_street: row.address_street,
    address_district: row.address_district,
    city: row.city,
    state: row.state,
    postal_code: row.postal_code,
    service_area: row.service_area,
    opening_hours: row.opening_hours,
    maps_url: row.maps_url,
    show_map: row.show_map,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    logo_media_id: row.logo_media_id,
    og_media_id: row.og_media_id,
  };
}
