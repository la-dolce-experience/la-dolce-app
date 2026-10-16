import type { SiteSettings } from '../types/content';

/** Aceita apenas URLs https (defesa extra além da validação no banco). */
export function safeExternalUrl(value: string | undefined | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function formatPostalCode(cep: string): string {
  const d = cep.replace(/\D/g, '');
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : cep;
}

export function hasPhysicalAddress(s: SiteSettings): boolean {
  return s.addressStreet.trim().length > 0;
}

/** Linhas do endereço para exibição. Vazio se não houver endereço físico. */
export function addressLines(s: SiteSettings): string[] {
  if (!hasPhysicalAddress(s)) return [];
  const cityState = [s.city, s.state].filter(Boolean).join(' - ');
  return [
    [s.addressStreet, s.addressDistrict].filter(Boolean).join(', '),
    [cityState, s.postalCode && `CEP ${formatPostalCode(s.postalCode)}`].filter(Boolean).join(' · '),
  ].filter(Boolean);
}

function addressQuery(s: SiteSettings): string {
  return [s.addressStreet, s.addressDistrict, s.city, s.state, s.postalCode].filter(Boolean).join(', ');
}

/** Link para abrir no Google Maps: o configurado no painel ou um gerado a partir do endereço. */
export function mapsLink(s: SiteSettings): string | null {
  const configured = safeExternalUrl(s.mapsUrl);
  if (configured) return configured;
  if (!hasPhysicalAddress(s)) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery(s))}`;
}

/** URL do mapa incorporado (só com endereço confirmado e mapa habilitado). */
export function mapsEmbedUrl(s: SiteSettings): string | null {
  if (!s.showMap || !hasPhysicalAddress(s)) return null;
  return `https://www.google.com/maps?q=${encodeURIComponent(addressQuery(s))}&output=embed`;
}
