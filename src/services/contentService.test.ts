import { defaultContent } from '../content/defaultContent';
import { mapContent, type ContentRows, type MediaRow } from './contentService';

const media = (id: string, path: string): MediaRow => ({
  id,
  src_lg: `uploads/${path}-lg.webp`,
  src_sm: `uploads/${path}-sm.webp`,
  width_lg: 1600,
  height_lg: 1200,
  width_sm: 800,
  height_sm: 600,
  size_bytes: 1000,
  mime_type: 'image/webp',
  alt: 'Alt padrão',
  original_name: 'foto.jpg',
  created_at: '2026-10-16',
});

const emptyRows: ContentRows = {
  settings: null,
  sections: [],
  eventTypes: [],
  features: [],
  steps: [],
  gallery: [],
  faqs: [],
  testimonials: [],
};

describe('mapContent', () => {
  it('usa o conteúdo padrão para o que não veio do banco', () => {
    const content = mapContent(emptyRows);
    expect(content.settings).toEqual(defaultContent.settings);
    expect(content.sections.hero.title).toBe(defaultContent.sections.hero.title);
  });

  it('filtra itens ocultos, ordena por posição e esconde depoimentos não autorizados', () => {
    const content = mapContent({
      ...emptyRows,
      faqs: [
        { id: 'b', question: 'B?', answer: 'b', position: 2, visible: true },
        { id: 'a', question: 'A?', answer: 'a', position: 1, visible: true },
        { id: 'h', question: 'Oculta?', answer: 'h', position: 0, visible: false },
      ],
      testimonials: [
        { id: 't1', author: 'Sem autorização', context: '', quote: 'x', authorized: false, position: 0, visible: true },
        { id: 't2', author: 'Autorizado', context: '', quote: 'y', authorized: true, position: 1, visible: true },
      ],
    });
    expect(content.faqs.map((f) => f.id)).toEqual(['a', 'b']);
    expect(content.testimonials.map((t) => t.author)).toEqual(['Autorizado']);
  });

  it('gera srcset com as duas variantes e usa o alt específico da seção', () => {
    const content = mapContent({
      ...emptyRows,
      sections: [
        {
          key: 'hero',
          eyebrow: '',
          title: 'Novo título',
          body: '',
          cta_label: '',
          note: '',
          image_caption: '',
          image_media_id: 'm1',
          image_alt: 'Alt da seção',
          visible: true,
          updated_at: '',
          media: media('m1', 'abc'),
        },
      ],
    });
    const image = content.sections.hero.image!;
    expect(content.sections.hero.title).toBe('Novo título');
    expect(image.alt).toBe('Alt da seção');
    expect(image.srcSet).toMatch(/abc-sm\.webp 800w, .*abc-lg\.webp 1600w/);
  });

  it('descarta itens de galeria sem imagem', () => {
    const content = mapContent({
      ...emptyRows,
      gallery: [
        { id: 'g1', media_id: 'm1', alt: '', caption: '', position: 0, visible: true, media: media('m1', 'x') },
        { id: 'g2', media_id: 'm2', alt: '', caption: '', position: 1, visible: true, media: null },
      ],
    });
    expect(content.gallery).toHaveLength(1);
    expect(content.gallery[0].image.alt).toBe('Alt padrão');
  });
});
