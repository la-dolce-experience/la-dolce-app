import type { ListScope, ListTable } from '../lib/preview';
import { MEDIA_BUCKET, requireSupabase } from '../lib/supabase';
import type { SectionKey } from '../types/content';
import type { Tables, TablesInsert, TablesUpdate } from '../types/database';

export type { ListScope, ListTable };
export type ListRow<T extends ListTable> = Tables<T>;

export type SettingsRow = Tables<'site_settings'>;
export type SettingsPatch = TablesUpdate<'site_settings'>;
export type SectionRow = Tables<'sections'>;
export type SectionPatch = TablesUpdate<'sections'>;
export type MediaRow = Tables<'media'>;

function check<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw result.error;
  if (result.data === null) throw new Error('Registro não encontrado.');
  return result.data;
}

/**
 * As listas compartilham a mesma forma (id, position, visible); o cliente tipado
 * não consegue estreitar uniões de tabelas, então usamos uma delas como referência.
 */
const listTable = (table: ListTable) => requireSupabase().from(table as 'faqs');

// ---------------- Autenticação ----------------

export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await requireSupabase().rpc('is_admin');
  if (error) throw error;
  return data === true;
}

// ---------------- Configurações ----------------

export async function getSettings(): Promise<SettingsRow> {
  return check(await requireSupabase().from('site_settings').select('*').eq('id', 1).single());
}

export async function updateSettings(patch: SettingsPatch): Promise<SettingsRow> {
  return check(await requireSupabase().from('site_settings').update(patch).eq('id', 1).select().single());
}

// ---------------- Seções ----------------

export async function getSection(key: SectionKey): Promise<SectionRow> {
  return check(await requireSupabase().from('sections').select('*').eq('key', key).single());
}

export async function updateSection(key: SectionKey, patch: SectionPatch): Promise<SectionRow> {
  return check(await requireSupabase().from('sections').update(patch).eq('key', key).select().single());
}

export async function listSections(): Promise<SectionRow[]> {
  return check(await requireSupabase().from('sections').select('*'));
}

// ---------------- Listas ordenáveis ----------------

/** Itens de uma lista, na ordem do site. Com `scope`, só o recorte (ex.: os sabores de flavor_items). */
export async function listItems<T extends ListTable>(table: T, scope?: ListScope): Promise<ListRow<T>[]> {
  let query = listTable(table).select('*');
  if (scope) query = query.eq(scope.column as 'id', scope.value);
  const result = await query.order('position');
  return check(result) as unknown as ListRow<T>[];
}

export async function insertItem<T extends ListTable>(table: T, row: TablesInsert<T>): Promise<ListRow<T>> {
  // O cliente tipado não estreita bem uniões de tabelas; o tipo de entrada já é validado acima.
  const result = await requireSupabase()
    .from(table)
    .insert(row as never)
    .select()
    .single();
  return check(result) as ListRow<T>;
}

export async function updateItem<T extends ListTable>(
  table: T,
  id: string,
  patch: TablesUpdate<T>,
): Promise<ListRow<T>> {
  const result = await listTable(table)
    .update(patch as never)
    .eq('id', id)
    .select()
    .single();
  return check(result) as unknown as ListRow<T>;
}

export async function deleteItem(table: ListTable, id: string): Promise<void> {
  const { error } = await listTable(table).delete().eq('id', id);
  if (error) throw error;
}

/** Grava a nova ordem: a posição de cada item passa a ser seu índice na lista. */
export async function reorderItems(table: ListTable, orderedIds: string[]): Promise<void> {
  const results = await Promise.all(
    orderedIds.map((id, position) => listTable(table).update({ position }).eq('id', id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

// ---------------- Imagens ----------------

export async function listMedia(): Promise<MediaRow[]> {
  return check(await requireSupabase().from('media').select('*').order('created_at', { ascending: false }));
}

export async function updateMediaAlt(id: string, alt: string): Promise<MediaRow> {
  return check(await requireSupabase().from('media').update({ alt }).eq('id', id).select().single());
}

export interface ProcessedImage {
  large: Blob;
  small: Blob;
  width: number;
  height: number;
  smallWidth: number;
  smallHeight: number;
  mimeType: 'image/webp' | 'image/jpeg';
}

/** Envia as duas variantes ao Storage e registra os metadados. Em caso de falha, desfaz o upload. */
export async function uploadMedia(image: ProcessedImage, alt: string, originalName: string): Promise<MediaRow> {
  const db = requireSupabase();
  const ext = image.mimeType === 'image/webp' ? 'webp' : 'jpg';
  const id = crypto.randomUUID();
  const lgPath = `uploads/${id}-lg.${ext}`;
  const smPath = `uploads/${id}-sm.${ext}`;
  const storage = db.storage.from(MEDIA_BUCKET);
  const options = { contentType: image.mimeType, cacheControl: '31536000', upsert: false };

  const uploaded: string[] = [];
  try {
    const lg = await storage.upload(lgPath, image.large, options);
    if (lg.error) throw lg.error;
    uploaded.push(lgPath);
    const sm = await storage.upload(smPath, image.small, options);
    if (sm.error) throw sm.error;
    uploaded.push(smPath);

    return check(
      await db
        .from('media')
        .insert({
          src_lg: lgPath,
          src_sm: smPath,
          width_lg: image.width,
          height_lg: image.height,
          width_sm: image.smallWidth,
          height_sm: image.smallHeight,
          size_bytes: image.large.size,
          mime_type: image.mimeType,
          alt,
          original_name: originalName.slice(0, 200),
        })
        .select()
        .single(),
    );
  } catch (error) {
    if (uploaded.length) await storage.remove(uploaded);
    throw error;
  }
}

export interface MediaUsage {
  label: string;
}

const SECTION_LABELS: Record<string, string> = {
  hero: 'Destaque principal',
  experience: 'Experiência',
  flavors: 'Sabores e apresentação',
};

/** Onde a imagem é usada no site (para avisar antes de excluir). */
export async function getMediaUsage(mediaId: string): Promise<MediaUsage[]> {
  const db = requireSupabase();
  const [sections, settings, gallery, flavors, testimonials] = await Promise.all([
    db.from('sections').select('key').eq('image_media_id', mediaId),
    db.from('site_settings').select('logo_media_id, og_media_id').eq('id', 1).maybeSingle(),
    db.from('gallery_items').select('id').eq('media_id', mediaId),
    db.from('flavor_items').select('title').eq('media_id', mediaId),
    db.from('testimonials').select('author').eq('media_id', mediaId),
  ]);
  for (const r of [sections, settings, gallery, flavors, testimonials]) if (r.error) throw r.error;

  const usage: MediaUsage[] = (sections.data ?? []).map((s) => ({
    label: `Seção "${SECTION_LABELS[s.key] ?? s.key}"`,
  }));
  if (settings.data?.logo_media_id === mediaId) usage.push({ label: 'Logotipo' });
  if (settings.data?.og_media_id === mediaId) usage.push({ label: 'Imagem de compartilhamento (SEO)' });
  const g = gallery.data?.length ?? 0;
  if (g > 0) usage.push({ label: g === 1 ? 'Galeria (1 foto)' : `Galeria (${g} fotos)` });
  for (const f of flavors.data ?? []) usage.push({ label: `Sabores e apresentação: "${f.title}"` });
  for (const t of testimonials.data ?? []) usage.push({ label: `Depoimento de ${t.author}` });
  return usage;
}

/**
 * Exclui o registro da imagem (as seções que a usavam ficam sem imagem e os
 * itens de galeria são removidos pelo banco) e apaga os arquivos do Storage.
 * Imagens estáticas do site ("/images/...") não têm arquivo no Storage.
 */
export async function deleteMedia(media: MediaRow): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from('media').delete().eq('id', media.id);
  if (error) throw error;
  const paths = [media.src_lg, media.src_sm].filter((p) => !p.startsWith('/') && !/^https?:/.test(p));
  if (paths.length) {
    const removed = await db.storage.from(MEDIA_BUCKET).remove([...new Set(paths)]);
    // O registro já foi excluído; um arquivo órfão não afeta o site, então só registramos.
    if (removed.error) console.warn('[imagens] falha ao remover arquivo do Storage:', removed.error.message);
  }
}

// ---------------- Preferências do usuário ----------------

/** Registra na conta do usuário que o guia de boas-vindas foi visto (vale em qualquer computador). */
export async function markOnboardingCompleted(): Promise<void> {
  const { error } = await requireSupabase().auth.updateUser({
    data: { onboarding_completed_at: new Date().toISOString() },
  });
  if (error) throw error;
}

// ---------------- Métricas ----------------

export interface EventSummaryRow {
  day: string;
  kind: 'visit' | 'whatsapp_click';
  source: string | null;
  total: number;
}

/** Visitas e cliques no WhatsApp por dia e origem (horário de Brasília). */
export async function getEventsSummary(days = 30): Promise<EventSummaryRow[]> {
  const { data, error } = await requireSupabase().rpc('events_summary', { p_days: days });
  if (error) throw error;
  return (data ?? []).map((r) => ({ ...r, kind: r.kind as EventSummaryRow['kind'], total: Number(r.total) }));
}

// ---------------- Lixeira ----------------

export type TrashRow = Tables<'trash'>;

export async function listTrash(): Promise<TrashRow[]> {
  return check(await requireSupabase().from('trash').select('*').order('deleted_at', { ascending: false }));
}

export async function restoreFromTrash(id: string): Promise<void> {
  const { error } = await requireSupabase().rpc('restore_from_trash', { p_id: id });
  if (error) throw error;
}

export async function deleteFromTrash(id: string): Promise<void> {
  const { error } = await requireSupabase().from('trash').delete().eq('id', id);
  if (error) throw error;
}

// ---------------- Cópia de segurança ----------------

export interface ContentBackup {
  formato: 'la-dolce-backup';
  versao: 1;
  geradoEm: string;
  observacao: string;
  dados: Record<string, unknown>;
}

/** Todo o conteúdo editável (inclusive itens ocultos), em JSON. Os arquivos de imagem continuam no Storage. */
export async function exportContent(): Promise<ContentBackup> {
  const sb = requireSupabase();
  const [settings, sections, eventTypes, features, flavors, steps, gallery, faqs, testimonials, media] =
    await Promise.all([
      sb.from('site_settings').select('*'),
      sb.from('sections').select('*').order('key'),
      sb.from('event_types').select('*').order('position'),
      sb.from('features').select('*').order('position'),
      sb.from('flavor_items').select('*').order('kind').order('position'),
      sb.from('steps').select('*').order('position'),
      sb.from('gallery_items').select('*').order('position'),
      sb.from('faqs').select('*').order('position'),
      sb.from('testimonials').select('*').order('position'),
      sb.from('media').select('*').order('created_at'),
    ]);
  return {
    formato: 'la-dolce-backup',
    versao: 1,
    geradoEm: new Date().toISOString(),
    observacao:
      'Cópia dos textos, contatos, listas e referências das imagens. Os arquivos de imagem ficam no Storage do Supabase (bucket "media").',
    dados: {
      site_settings: check(settings),
      sections: check(sections),
      event_types: check(eventTypes),
      features: check(features),
      flavor_items: check(flavors),
      steps: check(steps),
      gallery_items: check(gallery),
      faqs: check(faqs),
      testimonials: check(testimonials),
      media: check(media),
    },
  };
}

// ---------------- Republicação do site ----------------

export type RepublishResult =
  | { status: 'ok' }
  | { status: 'not_configured' }
  | { status: 'wait'; retryAfterSeconds: number }
  | { status: 'failed'; detail?: string };

/** Pede à Edge Function "republicar-site" um novo deploy na Vercel (atualiza a prévia do link). */
export async function requestRepublish(): Promise<RepublishResult> {
  const { error } = await requireSupabase().functions.invoke('republicar-site', { method: 'POST' });
  if (!error) return { status: 'ok' };
  const response = (error as { context?: Response }).context;
  if (!(response instanceof Response)) throw error;
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    retry_after_seconds?: number;
    detail?: string;
  };
  if (response.status === 503) return { status: 'not_configured' };
  if (response.status === 429) return { status: 'wait', retryAfterSeconds: body.retry_after_seconds ?? 300 };
  if (response.status === 401 || response.status === 403)
    throw Object.assign(new Error('permission denied'), { code: '42501' });
  return { status: 'failed', detail: body.detail };
}

export type DeployRequestRow = Tables<'deploy_requests'>;

export async function getLastDeployRequest(): Promise<DeployRequestRow | null> {
  const { data, error } = await requireSupabase()
    .from('deploy_requests')
    .select('*')
    .order('requested_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}
