/**
 * Pré-visualização de alterações ainda não salvas.
 *
 * O painel guarda o rascunho no localStorage deste navegador e abre o site com ?previa=1.
 * O site aplica o rascunho sobre o conteúdo publicado e se atualiza enquanto a pessoa digita.
 * Nada vai para o banco: só quem está editando, neste navegador, vê a pré-visualização.
 */
import type { Tables } from '../types/database';
import type { SectionKey } from '../types/content';

/** Tabelas de listas ordenáveis editadas no painel. */
export type ListTable =
  'event_types' | 'features' | 'steps' | 'gallery_items' | 'faqs' | 'testimonials' | 'flavor_items';

/** Recorte de uma tabela editado por uma lista do painel (ex.: só os sabores de flavor_items). */
export interface ListScope {
  column: 'kind';
  value: string;
}

type MediaRow = Tables<'media'>;
type SectionRow = Tables<'sections'>;
type SettingsRow = Tables<'site_settings'>;

export type SectionDraft = Pick<
  SectionRow,
  'eyebrow' | 'title' | 'body' | 'cta_label' | 'note' | 'image_caption' | 'image_media_id' | 'image_alt' | 'visible'
> & { media: MediaRow | null };

export type SettingsDraft = Partial<Omit<SettingsRow, 'id' | 'updated_at'>> & {
  logo?: MediaRow | null;
  og?: MediaRow | null;
};

/** Linha de lista como está na tela do painel (salva ou não), já na ordem do site. */
export type ListDraftRow = Record<string, unknown> & { id: string; position: number; media?: MediaRow | null };

export interface ListDraft {
  table: ListTable;
  scope?: ListScope;
  rows: ListDraftRow[];
}

export interface PreviewDraft {
  sections: Partial<Record<SectionKey, SectionDraft>>;
  settings: SettingsDraft;
  /** Chave: tabela, ou "tabela:valor" quando a lista é um recorte (ver listDraftKey). */
  lists: Record<string, ListDraft>;
  updatedAt: string;
}

export const PREVIEW_STORAGE_KEY = 'la-dolce:previa';
export const PREVIEW_PARAM = 'previa';
/** Pré-visualização embutida no painel (iframe): sem a faixa com o botão de fechar. */
export const EMBED_PARAM = 'painel';
const WINDOW_NAME = 'la-dolce-previa';

/** Parâmetros da URL atual; vazio na pré-renderização do build (sem window). */
const currentSearch = () => (typeof window === 'undefined' ? '' : window.location.search);

export function isPreviewMode(search = currentSearch()): boolean {
  return new URLSearchParams(search).has(PREVIEW_PARAM);
}

export function isEmbeddedPreview(search = currentSearch()): boolean {
  return isPreviewMode(search) && new URLSearchParams(search).has(EMBED_PARAM);
}

export const listDraftKey = (table: ListTable, scope?: ListScope) => (scope ? `${table}:${scope.value}` : table);

export function readPreviewDraft(): PreviewDraft | null {
  try {
    const raw = localStorage.getItem(PREVIEW_STORAGE_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<PreviewDraft>;
    return {
      sections: draft.sections ?? {},
      settings: draft.settings ?? {},
      lists: draft.lists ?? {},
      updatedAt: draft.updatedAt ?? '',
    };
  } catch {
    return null;
  }
}

function write(draft: PreviewDraft) {
  try {
    if ([draft.sections, draft.settings, draft.lists].every((part) => Object.keys(part).length === 0)) {
      localStorage.removeItem(PREVIEW_STORAGE_KEY);
    } else {
      localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(draft));
    }
  } catch {
    // Armazenamento indisponível (modo privado restrito): a pré-visualização só não funciona.
  }
}

/** Atualiza a parte do rascunho que pertence a uma tela do painel. */
export function updatePreviewDraft(part: {
  section?: [SectionKey, SectionDraft];
  settings?: SettingsDraft;
  list?: ListDraft;
}) {
  const draft = readPreviewDraft() ?? { sections: {}, settings: {}, lists: {}, updatedAt: '' };
  if (part.section) draft.sections[part.section[0]] = part.section[1];
  if (part.settings) draft.settings = { ...draft.settings, ...part.settings };
  if (part.list) draft.lists[listDraftKey(part.list.table, part.list.scope)] = part.list;
  draft.updatedAt = new Date().toISOString();
  write(draft);
}

/** Remove do rascunho uma seção, uma lista ou campos de configuração (ao salvar, descartar ou sair da tela). */
export function clearPreviewDraft(part: { section?: SectionKey; settingsFields?: string[]; list?: string }) {
  const draft = readPreviewDraft();
  if (!draft) return;
  if (part.section) delete draft.sections[part.section];
  if (part.list) delete draft.lists[part.list];
  for (const field of part.settingsFields ?? []) delete draft.settings[field as keyof SettingsDraft];
  if (part.settingsFields?.includes('logo_media_id')) delete draft.settings.logo;
  if (part.settingsFields?.includes('og_media_id')) delete draft.settings.og;
  draft.updatedAt = new Date().toISOString();
  write(draft);
}

export const previewUrl = (anchor?: string, embedded = false) =>
  `/?${PREVIEW_PARAM}=1${embedded ? `&${EMBED_PARAM}=1` : ''}${anchor ? `#${anchor}` : ''}`;

/** Abre (ou reaproveita) a aba de pré-visualização na seção indicada. */
export function openPreview(anchor?: string) {
  window.open(previewUrl(anchor), WINDOW_NAME);
}
