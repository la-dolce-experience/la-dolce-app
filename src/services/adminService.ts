import type { ListScope, ListTable } from '../lib/preview';
import { MEDIA_BUCKET, requireSupabase } from '../lib/supabase';
import type { Json, Tables, TablesInsert, TablesUpdate } from '../types/database';

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

const listTable = (table: ListTable) => requireSupabase().from(table);

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

/** Todas as seções (inclusive as ocultas), na ordem da página. */
export async function listSections(): Promise<SectionRow[]> {
  return check(await requireSupabase().from('sections').select('*').order('position'));
}

export async function getSection(id: string): Promise<SectionRow> {
  return check(await requireSupabase().from('sections').select('*').eq('id', id).single());
}

export async function updateSection(id: string, patch: SectionPatch): Promise<SectionRow> {
  return check(await requireSupabase().from('sections').update(patch).eq('id', id).select().single());
}

export interface NewSection {
  type: string;
  slug: string;
  name: string;
  nav_label?: string;
  /** Ícone no menu do painel (ver features/admin/sectionIcons.ts). */
  icon?: string;
  eyebrow?: string;
  title?: string;
  body?: string;
  cta_label?: string;
  options?: Json;
  visible?: boolean;
}

/** Cria uma seção na posição indicada (0 = topo); as seguintes descem uma casa. */
export async function createSection(section: NewSection, position: number): Promise<SectionRow> {
  return check(
    await requireSupabase()
      .rpc('create_section', { p_section: section as unknown as Json, p_position: position })
      .single(),
  );
}

/** Cópia oculta da seção, com os itens, logo abaixo da original. */
export async function duplicateSection(id: string, slug: string, name: string): Promise<SectionRow> {
  return check(await requireSupabase().rpc('duplicate_section', { p_id: id, p_slug: slug, p_name: name }).single());
}

/** Exclui a seção e os itens dela (ficam na lixeira por 30 dias). */
export async function deleteSection(id: string): Promise<void> {
  const { error } = await requireSupabase().from('sections').delete().eq('id', id);
  if (error) throw error;
}

/** Grava a nova ordem: a posição de cada seção passa a ser seu índice na lista. */
export async function reorderSections(orderedIds: string[]): Promise<void> {
  const { error } = await requireSupabase().rpc('reorder_sections', { p_ids: orderedIds });
  if (error) throw error;
}

// ---------------- Itens das seções ----------------

/** Itens de uma lista, na ordem do site. Com `scope`, só os de uma seção. */
export async function listItems<T extends ListTable>(table: T, scope?: ListScope): Promise<ListRow<T>[]> {
  let query = listTable(table).select('*');
  if (scope) query = query.eq(scope.column, scope.value);
  const result = await query.order('position');
  return check(result) as ListRow<T>[];
}

export async function insertItem<T extends ListTable>(table: T, row: TablesInsert<T>): Promise<ListRow<T>> {
  // Uma tabela só (section_items); o cliente tipado não estreita o genérico.
  return check(
    await listTable(table)
      .insert(row as never)
      .select()
      .single(),
  ) as ListRow<T>;
}

export async function updateItem<T extends ListTable>(
  table: T,
  id: string,
  patch: TablesUpdate<T>,
): Promise<ListRow<T>> {
  return check(
    await listTable(table)
      .update(patch as never)
      .eq('id', id)
      .select()
      .single(),
  ) as ListRow<T>;
}

export async function deleteItem(table: ListTable, id: string): Promise<void> {
  const { error } = await listTable(table).delete().eq('id', id);
  if (error) throw error;
}

/** Grava a nova ordem dos itens: a posição de cada um passa a ser seu índice na lista. */
export async function reorderItems(_table: ListTable, orderedIds: string[]): Promise<void> {
  const { error } = await requireSupabase().rpc('reorder_section_items', { p_ids: orderedIds });
  if (error) throw error;
}

// ---------------- Imagens ----------------

export async function listMedia(): Promise<MediaRow[]> {
  return check(await requireSupabase().from('media').select('*').order('created_at', { ascending: false }));
}

/** Uma imagem da biblioteca (ex.: a original de um recorte). null se não existe mais. */
export async function getMedia(id: string): Promise<MediaRow | null> {
  return check(await requireSupabase().from('media').select('*').eq('id', id).maybeSingle());
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

/** Recorte feito no painel: a imagem original e a área recortada (em %), para recortar de novo a partir dela. */
export interface CropOrigin {
  source_media_id: string;
  crop: { x: number; y: number; width: number; height: number; aspect: number | null };
}

/** Envia as duas variantes ao Storage e registra os metadados. Em caso de falha, desfaz o upload. */
export async function uploadMedia(
  image: ProcessedImage,
  alt: string,
  originalName: string,
  origin?: CropOrigin,
): Promise<MediaRow> {
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
          ...(origin && { source_media_id: origin.source_media_id, crop: { ...origin.crop } }),
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

/** Onde a imagem é usada no site (para avisar antes de excluir). */
export async function getMediaUsage(mediaId: string): Promise<MediaUsage[]> {
  const db = requireSupabase();
  const [sections, settings, items] = await Promise.all([
    db.from('sections').select('id, name, image_media_id'),
    db.from('site_settings').select('logo_media_id, og_media_id').eq('id', 1).maybeSingle(),
    db
      .from('section_items')
      .select('section_id, title, media_id')
      .or(`media_id.eq.${mediaId},photo_media_ids.cs.{${mediaId}}`),
  ]);
  for (const r of [sections, settings, items]) if (r.error) throw r.error;

  const names = new Map((sections.data ?? []).map((s) => [s.id, s.name]));
  const usage: MediaUsage[] = (sections.data ?? [])
    .filter((s) => s.image_media_id === mediaId)
    .map((s) => ({ label: `Seção "${s.name}"` }));
  if (settings.data?.logo_media_id === mediaId) usage.push({ label: 'Logotipo' });
  if (settings.data?.og_media_id === mediaId) usage.push({ label: 'Imagem de compartilhamento (SEO)' });
  for (const i of items.data ?? []) {
    const section = names.get(i.section_id) ?? 'Seção';
    usage.push({ label: i.title ? `${section}: "${i.title}"` : section });
  }
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
  /** 2: seções ordenáveis (sections + section_items). A versão 1 era do modelo com uma tabela por lista. */
  versao: 2;
  geradoEm: string;
  observacao: string;
  dados: Record<string, unknown>;
}

/** Todo o conteúdo editável (inclusive itens ocultos), em JSON. Os arquivos de imagem continuam no Storage. */
export async function exportContent(): Promise<ContentBackup> {
  const sb = requireSupabase();
  const [settings, sections, items, media] = await Promise.all([
    sb.from('site_settings').select('*'),
    sb.from('sections').select('*').order('position'),
    sb.from('section_items').select('*').order('section_id').order('position'),
    sb.from('media').select('*').order('created_at'),
  ]);
  return {
    formato: 'la-dolce-backup',
    versao: 2,
    geradoEm: new Date().toISOString(),
    observacao:
      'Cópia dos textos, contatos, seções e referências das imagens. Os arquivos de imagem ficam no Storage do Supabase (bucket "media").',
    dados: {
      site_settings: check(settings),
      sections: check(sections),
      section_items: check(items),
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
