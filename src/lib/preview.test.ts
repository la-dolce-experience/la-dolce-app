import { applyPreviewDraft, type ContentRows, type MediaRow } from '../services/contentService';
import {
  clearPreviewDraft,
  isPreviewMode,
  PREVIEW_STORAGE_KEY,
  readPreviewDraft,
  updatePreviewDraft,
  type SectionDraft,
} from './preview';

const media = { id: 'm2', src_lg: '/images/nova.webp', alt: 'Nova foto' } as MediaRow;
const heroDraft: SectionDraft = {
  eyebrow: '',
  title: 'Título em rascunho',
  body: 'Texto',
  cta_label: '',
  note: '',
  image_caption: '',
  image_media_id: 'm2',
  image_alt: 'Nova foto',
  visible: true,
  media,
};

beforeEach(() => localStorage.clear());

describe('rascunho da pré-visualização', () => {
  it('reconhece o modo de pré-visualização pelo endereço', () => {
    expect(isPreviewMode('?previa=1')).toBe(true);
    expect(isPreviewMode('?utm_source=x')).toBe(false);
  });

  it('guarda seções e configurações e limpa só a parte salva ou descartada', () => {
    updatePreviewDraft({ section: ['hero', heroDraft] });
    updatePreviewDraft({ settings: { whatsapp_number: '5511999990000', logo: media, logo_media_id: 'm2' } });
    expect(readPreviewDraft()?.sections.hero?.title).toBe('Título em rascunho');
    expect(readPreviewDraft()?.settings.whatsapp_number).toBe('5511999990000');

    clearPreviewDraft({ settingsFields: ['whatsapp_number', 'logo_media_id'] });
    expect(readPreviewDraft()?.settings).toEqual({});
    expect(readPreviewDraft()?.sections.hero).toBeDefined();

    clearPreviewDraft({ section: 'hero' });
    expect(localStorage.getItem(PREVIEW_STORAGE_KEY)).toBeNull();
  });

  it('ignora um rascunho corrompido', () => {
    localStorage.setItem(PREVIEW_STORAGE_KEY, '{quebrado');
    expect(readPreviewDraft()).toBeNull();
  });

  it('aplica o rascunho sobre o conteúdo publicado sem alterar o resto', () => {
    const rows = {
      settings: { id: 1, whatsapp_number: '5511920102743', business_name: 'La Dolce', logo: null, og: null },
      sections: [
        { key: 'hero', title: 'Publicado', body: 'Texto publicado', media: null },
        { key: 'quote', title: 'Orçamento', media: null },
      ],
      eventTypes: [],
      features: [],
      steps: [],
      gallery: [],
      faqs: [],
      testimonials: [],
    } as unknown as ContentRows;

    const result = applyPreviewDraft(rows, {
      sections: { hero: heroDraft },
      settings: { whatsapp_number: '5511999990000', logo: media },
      updatedAt: '',
    });
    expect(result.sections[0]).toMatchObject({ key: 'hero', title: 'Título em rascunho', media });
    expect(result.sections[1]).toBe(rows.sections[1]);
    expect(result.settings).toMatchObject({ whatsapp_number: '5511999990000', business_name: 'La Dolce', logo: media });
    expect(applyPreviewDraft(rows, null)).toBe(rows);
  });
});
