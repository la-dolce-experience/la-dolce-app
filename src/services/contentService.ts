import { defaultContent } from '../content/defaultContent';
import { isSupabaseConfigured, MEDIA_BUCKET, SUPABASE_ANON_KEY, SUPABASE_URL } from '../lib/env';
import type { Tables } from '../types/database';
import {
  SECTION_KEYS,
  type ImageRef,
  type Section,
  type SectionKey,
  type SiteContent,
  type SiteSettings,
} from '../types/content';

export type MediaRow = Tables<'media'>;
type SectionRow = Tables<'sections'> & { media: MediaRow | null };
type SettingsRow = Tables<'site_settings'> & { logo: MediaRow | null; og: MediaRow | null };
type GalleryRow = Tables<'gallery_items'> & { media: MediaRow | null };

export interface ContentRows {
  settings: SettingsRow | null;
  sections: SectionRow[];
  eventTypes: Tables<'event_types'>[];
  features: Tables<'features'>[];
  steps: Tables<'steps'>[];
  gallery: GalleryRow[];
  faqs: Tables<'faqs'>[];
  testimonials: Tables<'testimonials'>[];
}

/** Caminho no bucket -> URL pública. Caminhos absolutos ("/images/...", "https://...") ficam como estão. */
export function resolveMediaUrl(path: string): string {
  if (path.startsWith('/') || /^https?:\/\//.test(path)) return path;
  if (!SUPABASE_URL) return path;
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  return `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${encoded}`;
}

export function mediaToImage(media: MediaRow, altOverride?: string): ImageRef {
  const lg = resolveMediaUrl(media.src_lg);
  const sm = resolveMediaUrl(media.src_sm);
  return {
    mediaId: media.id,
    src: lg,
    srcSet: sm !== lg ? `${sm} ${media.width_sm}w, ${lg} ${media.width_lg}w` : undefined,
    alt: altOverride?.trim() || media.alt,
    width: media.width_lg,
    height: media.height_lg,
  };
}

function mapSettings(row: SettingsRow | null): SiteSettings {
  const d = defaultContent.settings;
  if (!row) return d;
  return {
    businessName: row.business_name,
    footerTagline: row.footer_tagline,
    logo: row.logo ? mediaToImage(row.logo, row.business_name) : d.logo,
    whatsappNumber: row.whatsapp_number,
    whatsappGreeting: row.whatsapp_greeting,
    phone: row.phone,
    email: row.email,
    instagramUrl: row.instagram_url,
    facebookUrl: row.facebook_url,
    tiktokUrl: row.tiktok_url,
    addressStreet: row.address_street,
    addressDistrict: row.address_district,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    serviceArea: row.service_area,
    openingHours: row.opening_hours,
    mapsUrl: row.maps_url,
    showMap: row.show_map,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    ogImage: row.og ? mediaToImage(row.og) : null,
  };
}

function mapSection(row: SectionRow): Section {
  return {
    key: row.key as SectionKey,
    eyebrow: row.eyebrow,
    title: row.title,
    body: row.body,
    ctaLabel: row.cta_label,
    note: row.note,
    imageCaption: row.image_caption,
    image: row.media ? mediaToImage(row.media, row.image_alt) : null,
    visible: row.visible,
  };
}

const byPosition = <T extends { position: number }>(a: T, b: T) => a.position - b.position;

/** Converte as linhas do banco no modelo usado pelos componentes. Função pura (testável). */
export function mapContent(rows: ContentRows): SiteContent {
  const sectionMap = new Map(rows.sections.map((s) => [s.key, mapSection(s)]));
  const sections = Object.fromEntries(
    SECTION_KEYS.map((key) => [key, sectionMap.get(key) ?? defaultContent.sections[key]]),
  ) as Record<SectionKey, Section>;

  return {
    settings: mapSettings(rows.settings),
    sections,
    eventTypes: rows.eventTypes
      .filter((e) => e.visible)
      .sort(byPosition)
      .map((e) => ({ id: e.id, title: e.title, description: e.description, formLabel: e.form_label })),
    features: rows.features
      .filter((f) => f.visible)
      .sort(byPosition)
      .map((f) => ({ id: f.id, label: f.label })),
    steps: rows.steps
      .filter((s) => s.visible)
      .sort(byPosition)
      .map((s) => ({ id: s.id, title: s.title, description: s.description })),
    gallery: rows.gallery
      .filter((g) => g.visible && g.media)
      .sort(byPosition)
      .map((g) => ({ id: g.id, image: mediaToImage(g.media!, g.alt), caption: g.caption })),
    faqs: rows.faqs
      .filter((f) => f.visible)
      .sort(byPosition)
      .map((f) => ({ id: f.id, question: f.question, answer: f.answer })),
    testimonials: rows.testimonials
      .filter((t) => t.visible && t.authorized)
      .sort(byPosition)
      .map((t) => ({ id: t.id, author: t.author, context: t.context, quote: t.quote })),
  };
}

/** Leitura pública via API REST do Supabase (sem supabase-js, para um bundle menor). */
async function rest<T>(table: string, query: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Falha ao carregar "${table}" (HTTP ${res.status})`);
  return (await res.json()) as T;
}

/** Busca todo o conteúdo público em paralelo. Retorna null se o Supabase não estiver configurado. */
export async function fetchSiteContent(): Promise<SiteContent | null> {
  if (!isSupabaseConfigured) return null;
  const ordered = 'select=*&order=position.asc';

  const [settings, sections, eventTypes, features, steps, gallery, faqs, testimonials] = await Promise.all([
    rest<SettingsRow[]>(
      'site_settings',
      `id=eq.1&select=${encodeURIComponent('*,logo:media!site_settings_logo_media_id_fkey(*),og:media!site_settings_og_media_id_fkey(*)')}`,
    ),
    rest<SectionRow[]>('sections', `select=${encodeURIComponent('*,media(*)')}`),
    rest<Tables<'event_types'>[]>('event_types', ordered),
    rest<Tables<'features'>[]>('features', ordered),
    rest<Tables<'steps'>[]>('steps', ordered),
    rest<GalleryRow[]>('gallery_items', `select=${encodeURIComponent('*,media(*)')}&order=position.asc`),
    rest<Tables<'faqs'>[]>('faqs', ordered),
    rest<Tables<'testimonials'>[]>('testimonials', ordered),
  ]);

  return mapContent({
    settings: settings[0] ?? null,
    sections,
    eventTypes,
    features,
    steps,
    gallery,
    faqs,
    testimonials,
  });
}
