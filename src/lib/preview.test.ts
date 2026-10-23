import { applyPreviewDraft, type ContentRows, type MediaRow } from '../services/contentService';
import {
  clearPreviewDraft,
  isPreviewMode,
  notifyPublishedChange,
  PREVIEW_STORAGE_KEY,
  readPreviewDraft,
  readPublishedStamp,
  updatePreviewDraft,
  type SectionDraft,
} from './preview';

const media = { id: 'm2', src_lg: '/images/nova.webp', alt: 'Nova foto' } as MediaRow;
const heroDraft: SectionDraft = {
  id: 'h1',
  type: 'hero',
  slug: 'destaque',
  name: 'Destaque',
  nav_label: '',
  icon: '',
  position: 0,
  eyebrow: '',
  title: 'Título em rascunho',
  body: 'Texto',
  cta_label: '',
  note: '',
  image_caption: '',
  image_media_id: 'm2',
  image_alt: 'Nova foto',
  options: {},
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
    updatePreviewDraft({ section: heroDraft });
    updatePreviewDraft({ settings: { whatsapp_number: '5511999990000', logo: media, logo_media_id: 'm2' } });
    expect(readPreviewDraft()?.sections.h1?.title).toBe('Título em rascunho');
    expect(readPreviewDraft()?.settings.whatsapp_number).toBe('5511999990000');

    clearPreviewDraft({ settingsFields: ['whatsapp_number', 'logo_media_id'] });
    expect(readPreviewDraft()?.settings).toEqual({});
    expect(readPreviewDraft()?.sections.h1).toBeDefined();

    clearPreviewDraft({ section: 'h1' });
    expect(localStorage.getItem(PREVIEW_STORAGE_KEY)).toBeNull();
  });

  it('ignora um rascunho corrompido', () => {
    localStorage.setItem(PREVIEW_STORAGE_KEY, '{quebrado');
    expect(readPreviewDraft()).toBeNull();
  });

  it('marca quando o conteúdo publicado muda', () => {
    expect(readPublishedStamp()).toBe('');
    notifyPublishedChange();
    expect(readPublishedStamp()).not.toBe('');
  });

  it('aplica o rascunho sobre o conteúdo publicado sem alterar o resto', () => {
    const rows = {
      settings: { id: 1, whatsapp_number: '5511920102743', business_name: 'Negócio', logo: null, og: null },
      sections: [
        { id: 'h1', type: 'hero', title: 'Publicado', body: 'Texto publicado', media: null },
        { id: 'f1', type: 'formulario', title: 'Contato', media: null },
      ],
      items: [],
    } as unknown as ContentRows;

    const result = applyPreviewDraft(rows, {
      sections: { h1: heroDraft },
      settings: { whatsapp_number: '5511999990000', logo: media },
      lists: {},
      updatedAt: '',
    });
    expect(result.sections[0]).toMatchObject({ id: 'h1', title: 'Título em rascunho', media });
    expect(result.sections[1]).toBe(rows.sections[1]);
    expect(result.settings).toMatchObject({ whatsapp_number: '5511999990000', business_name: 'Negócio', logo: media });
    expect(applyPreviewDraft(rows, null)).toBe(rows);
  });

  it('inclui uma seção oculta no site quando ela está em rascunho', () => {
    const rows = { settings: null, sections: [], items: [] } as unknown as ContentRows;
    const result = applyPreviewDraft(rows, { sections: { h1: heroDraft }, settings: {}, lists: {}, updatedAt: '' });
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0]).toMatchObject({ id: 'h1', title: 'Título em rascunho' });
  });

  it('substitui só os itens da seção em rascunho e limpa a lista ao sair da tela', () => {
    const rows = {
      settings: null,
      sections: [],
      items: [
        { id: 'c1', section_id: 'cartoes', title: 'Publicado', position: 0 },
        { id: 'p1', section_id: 'faq', title: 'Pergunta publicada?', position: 0 },
      ],
    } as unknown as ContentRows;

    const scope = { column: 'section_id', value: 'cartoes' } as const;
    updatePreviewDraft({
      list: {
        table: 'section_items',
        scope,
        rows: [
          { id: 'c1', section_id: 'cartoes', title: 'Editado', position: 0 },
          { id: 'novo-1', section_id: 'cartoes', title: 'Novo', position: 1 },
        ],
      },
    });
    const result = applyPreviewDraft(rows, readPreviewDraft());
    expect(result.items.map((i) => i.title)).toEqual(['Pergunta publicada?', 'Editado', 'Novo']);

    clearPreviewDraft({ list: 'section_items:cartoes' });
    expect(localStorage.getItem(PREVIEW_STORAGE_KEY)).toBeNull();
  });
});
