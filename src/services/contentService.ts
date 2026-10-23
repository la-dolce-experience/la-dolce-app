import { defaultContent } from '../content/defaultContent';
import { isSupabaseConfigured, MEDIA_BUCKET, SUPABASE_ANON_KEY, SUPABASE_URL } from '../lib/env';
import { readPreviewDraft, readPublishedStamp, type PreviewDraft } from '../lib/preview';
import type { Tables } from '../types/database';
import {
  SECTION_TYPES,
  type ImageRef,
  type Section,
  type SectionItem,
  type SectionOptions,
  type SectionType,
  type SiteContent,
  type SiteSettings,
} from '../types/content';

export type MediaRow = Tables<'media'>;
type SectionRow = Tables<'sections'> & { media: MediaRow | null };
type SettingsRow = Tables<'site_settings'> & { logo: MediaRow | null; og: MediaRow | null };
/** `photos`: as imagens de photo_media_ids, na mesma ordem (o banco não as embute: é um array). */
type ItemRow = Tables<'section_items'> & { media?: MediaRow | null; photos?: MediaRow[] };

export interface ContentRows {
  settings: SettingsRow | null;
  sections: SectionRow[];
  items: ItemRow[];
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
    logo: row.logo ? mediaToImage(row.logo, row.business_name) : null,
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

const byPosition = <T extends { position: number }>(a: T, b: T) => a.position - b.position;

const clampRating = (n: number) => Math.min(5, Math.max(1, Math.round(Number(n) || 5)));

/** Só valores simples: o JSON de options vem do banco e pode ter qualquer formato. */
function mapOptions(value: unknown): SectionOptions {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => typeof v === 'string' || typeof v === 'boolean'),
  ) as SectionOptions;
}

function mapItem(row: ItemRow): SectionItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    label: row.label,
    image: row.media ? mediaToImage(row.media, row.alt || row.title) : null,
    photos: (row.photos ?? []).map((m) => mediaToImage(m, m.alt || row.title)),
    rating: clampRating(row.rating),
  };
}

function mapSection(row: SectionRow, items: ItemRow[]): Section {
  return {
    id: row.id,
    type: row.type as SectionType,
    slug: row.slug,
    navLabel: row.nav_label,
    eyebrow: row.eyebrow,
    title: row.title,
    body: row.body,
    ctaLabel: row.cta_label,
    note: row.note,
    imageCaption: row.image_caption,
    image: row.media ? mediaToImage(row.media, row.image_alt) : null,
    options: mapOptions(row.options),
    items: items
      .filter((i) => i.section_id === row.id && i.visible && i.authorized)
      // Galeria: um item sem foto (imagem excluída da biblioteca) não tem o que mostrar.
      .filter((i) => row.type !== 'galeria' || i.media)
      .sort(byPosition)
      .map(mapItem),
  };
}

/** Converte as linhas do banco no modelo usado pelos componentes. Função pura (testável). */
export function mapContent(rows: ContentRows): SiteContent {
  const known = new Set<string>(SECTION_TYPES);
  return {
    settings: mapSettings(rows.settings),
    sections: rows.sections
      .filter((s) => s.visible && known.has(s.type))
      .sort(byPosition)
      .map((s) => mapSection(s, rows.items)),
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

/** Busca as linhas de todo o conteúdo público em paralelo. */
export async function fetchContentRows(): Promise<ContentRows> {
  const withMedia = `select=${encodeURIComponent('*,media(*)')}&order=position.asc`;

  const [settings, sections, items] = await Promise.all([
    rest<SettingsRow[]>(
      'site_settings',
      `id=eq.1&select=${encodeURIComponent('*,logo:media!site_settings_logo_media_id_fkey(*),og:media!site_settings_og_media_id_fkey(*)')}`,
    ),
    rest<SectionRow[]>('sections', withMedia),
    rest<ItemRow[]>('section_items', withMedia),
  ]);

  return { settings: settings[0] ?? null, sections, items: await withPhotos(items) };
}

/** Busca de uma vez as fotos extras de todos os itens e as anexa a cada um, na ordem escolhida. */
async function withPhotos(rows: ItemRow[]): Promise<ItemRow[]> {
  const ids = [...new Set(rows.flatMap((t) => t.photo_media_ids ?? []))];
  if (ids.length === 0) return rows;
  const media = new Map((await rest<MediaRow[]>('media', `id=in.(${ids.join(',')})`)).map((m) => [m.id, m] as const));
  return rows.map((t) => ({
    ...t,
    photos: (t.photo_media_ids ?? []).map((id) => media.get(id)).filter((m): m is MediaRow => !!m),
  }));
}

/** Busca todo o conteúdo público. Retorna null se o Supabase não estiver configurado. */
export async function fetchSiteContent(): Promise<SiteContent | null> {
  if (!isSupabaseConfigured) return null;
  return mapContent(await fetchContentRows());
}

/** Aplica o rascunho da pré-visualização sobre as linhas publicadas. Função pura (testável). */
export function applyPreviewDraft(rows: ContentRows, draft: PreviewDraft | null): ContentRows {
  if (!draft) return rows;
  // Seções do rascunho substituem as publicadas; uma seção oculta no site (que o visitante não recebe) entra aqui.
  const drafted = new Map(Object.entries(draft.sections));
  const sections: SectionRow[] = [
    ...rows.sections.map((row) => {
      const d = drafted.get(row.id);
      drafted.delete(row.id);
      return d ? { ...row, ...d } : row;
    }),
    ...[...drafted.values()].map((d) => ({ ...d, updated_at: '' })),
  ];
  const { logo, og, ...fields } = draft.settings;
  const settings = rows.settings && {
    ...rows.settings,
    ...fields,
    ...(logo !== undefined && { logo }),
    ...(og !== undefined && { og }),
  };
  let items = rows.items;
  for (const list of Object.values(draft.lists ?? {})) {
    const { column, value } = list.scope ?? {};
    // Mantém os itens publicados das outras seções.
    const kept = column ? items.filter((r) => (r as Record<string, unknown>)[column] !== value) : [];
    items = [...kept, ...(list.rows as unknown as ItemRow[])];
  }
  return { settings, sections, items };
}

let publishedRows: Promise<ContentRows> | null = null;
let publishedStamp = '';

/**
 * Conteúdo da pré-visualização: as linhas publicadas são buscadas uma vez e o rascunho é reaplicado a cada mudança.
 * Quando o painel grava algo (ver notifyPublishedChange), as linhas publicadas são buscadas de novo.
 */
export async function fetchPreviewContent(): Promise<SiteContent | null> {
  if (!isSupabaseConfigured) return null;
  const stamp = readPublishedStamp();
  if (stamp !== publishedStamp) {
    publishedStamp = stamp;
    publishedRows = null;
  }
  publishedRows ??= fetchContentRows().catch((e: unknown) => {
    publishedRows = null;
    throw e;
  });
  return mapContent(applyPreviewDraft(await publishedRows, readPreviewDraft()));
}
