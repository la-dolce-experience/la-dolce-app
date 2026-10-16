/**
 * Pré-visualização de alterações ainda não salvas.
 *
 * O painel guarda o rascunho no localStorage deste navegador e abre o site com ?previa=1.
 * O site aplica o rascunho sobre o conteúdo publicado e se atualiza enquanto a pessoa digita.
 * Nada vai para o banco: só quem está editando, neste navegador, vê a pré-visualização.
 */
import type { Tables } from '../types/database';
import type { SectionKey } from '../types/content';

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

export interface PreviewDraft {
  sections: Partial<Record<SectionKey, SectionDraft>>;
  settings: SettingsDraft;
  updatedAt: string;
}

export const PREVIEW_STORAGE_KEY = 'la-dolce:previa';
export const PREVIEW_PARAM = 'previa';
const WINDOW_NAME = 'la-dolce-previa';

export function isPreviewMode(search = window.location.search): boolean {
  return new URLSearchParams(search).has(PREVIEW_PARAM);
}

export function readPreviewDraft(): PreviewDraft | null {
  try {
    const raw = localStorage.getItem(PREVIEW_STORAGE_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<PreviewDraft>;
    return { sections: draft.sections ?? {}, settings: draft.settings ?? {}, updatedAt: draft.updatedAt ?? '' };
  } catch {
    return null;
  }
}

function write(draft: PreviewDraft) {
  try {
    if (Object.keys(draft.sections).length === 0 && Object.keys(draft.settings).length === 0) {
      localStorage.removeItem(PREVIEW_STORAGE_KEY);
    } else {
      localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(draft));
    }
  } catch {
    // Armazenamento indisponível (modo privado restrito): a pré-visualização só não funciona.
  }
}

/** Atualiza a parte do rascunho que pertence a uma tela do painel. */
export function updatePreviewDraft(part: { section?: [SectionKey, SectionDraft]; settings?: SettingsDraft }) {
  const draft = readPreviewDraft() ?? { sections: {}, settings: {}, updatedAt: '' };
  if (part.section) draft.sections[part.section[0]] = part.section[1];
  if (part.settings) draft.settings = { ...draft.settings, ...part.settings };
  draft.updatedAt = new Date().toISOString();
  write(draft);
}

/** Remove do rascunho uma seção ou campos de configuração (ao salvar ou descartar). */
export function clearPreviewDraft(part: { section?: SectionKey; settingsFields?: string[] }) {
  const draft = readPreviewDraft();
  if (!draft) return;
  if (part.section) delete draft.sections[part.section];
  for (const field of part.settingsFields ?? []) delete draft.settings[field as keyof SettingsDraft];
  if (part.settingsFields?.includes('logo_media_id')) delete draft.settings.logo;
  if (part.settingsFields?.includes('og_media_id')) delete draft.settings.og;
  draft.updatedAt = new Date().toISOString();
  write(draft);
}

/** Abre (ou reaproveita) a aba de pré-visualização na seção indicada. */
export function openPreview(anchor?: string) {
  window.open(`/?${PREVIEW_PARAM}=1${anchor ? `#${anchor}` : ''}`, WINDOW_NAME);
}
