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
  source_media_id: null,
  crop: null,
});

const emptyRows: ContentRows = { settings: null, sections: [], items: [] };

type SectionRow = ContentRows['sections'][number];
type ItemRow = ContentRows['items'][number];

const section = (patch: Partial<SectionRow> & Pick<SectionRow, 'id' | 'type'>): SectionRow => ({
  slug: patch.id,
  name: patch.id,
  nav_label: '',
  icon: '',
  position: 0,
  eyebrow: '',
  title: 'Título',
  body: '',
  cta_label: '',
  note: '',
  image_caption: '',
  image_media_id: null,
  image_alt: '',
  options: {},
  visible: true,
  updated_at: '',
  media: null,
  ...patch,
});

const item = (patch: Partial<ItemRow> & Pick<ItemRow, 'id' | 'section_id'>): ItemRow => ({
  title: patch.id,
  description: '',
  label: '',
  media_id: null,
  alt: '',
  photo_media_ids: [],
  rating: 5,
  authorized: true,
  position: 0,
  visible: true,
  media: null,
  ...patch,
});

describe('mapContent', () => {
  it('ordena as seções pela posição e deixa de fora as ocultas e os tipos desconhecidos', () => {
    const content = mapContent({
      ...emptyRows,
      sections: [
        section({ id: 'faq', type: 'faq', position: 2 }),
        section({ id: 'hero', type: 'hero', position: 0 }),
        section({ id: 'oculta', type: 'texto_imagem', position: 1, visible: false }),
        section({ id: 'velha', type: 'tipo_removido', position: 3 }),
        section({ id: 'sobre', type: 'texto_imagem', position: 1 }),
      ],
    });
    expect(content.sections.map((s) => s.id)).toEqual(['hero', 'sobre', 'faq']);
  });

  it('entrega a cada seção só os itens dela, visíveis, autorizados e em ordem', () => {
    const content = mapContent({
      ...emptyRows,
      sections: [section({ id: 'faq', type: 'faq' }), section({ id: 'dep', type: 'depoimentos', position: 1 })],
      items: [
        item({ id: 'b', section_id: 'faq', position: 2 }),
        item({ id: 'a', section_id: 'faq', position: 1 }),
        item({ id: 'h', section_id: 'faq', position: 0, visible: false }),
        item({ id: 't1', section_id: 'dep', authorized: false }),
        item({ id: 't2', section_id: 'dep', position: 1 }),
      ],
    });
    expect(content.sections[0].items.map((i) => i.id)).toEqual(['a', 'b']);
    expect(content.sections[1].items.map((i) => i.id)).toEqual(['t2']);
  });

  it('mantém a nota entre 1 e 5 e usa as fotos na ordem escolhida, com texto alternativo', () => {
    const semAlt = { ...media('m4', 'b'), alt: '' };
    const content = mapContent({
      ...emptyRows,
      sections: [section({ id: 'dep', type: 'depoimentos' })],
      items: [
        item({
          id: 'a',
          section_id: 'dep',
          title: 'Ana',
          rating: 9,
          photo_media_ids: ['m3', 'm4'],
          photos: [media('m3', 'a'), semAlt],
        }),
        item({ id: 'b', section_id: 'dep', title: 'Bia', position: 1, rating: 3, media: media('m2', 'bia') }),
      ],
    });
    const [ana, bia] = content.sections[0].items;
    expect([ana.rating, bia.rating]).toEqual([5, 3]);
    expect(ana.image).toBeNull();
    expect(bia.image?.alt).toBe('Bia');
    expect(ana.photos.map((p) => p.mediaId)).toEqual(['m3', 'm4']);
    expect(ana.photos[1].alt).toBe('Ana');
    expect(bia.photos).toEqual([]);
  });

  it('usa as configurações padrão quando o banco não tem a linha', () => {
    const content = mapContent(emptyRows);
    expect(content.settings).toEqual(defaultContent.settings);
    expect(content.sections).toEqual([]);
  });

  it('gera srcset com as duas variantes e usa o alt específico da seção', () => {
    const content = mapContent({
      ...emptyRows,
      sections: [
        section({
          id: 'hero',
          type: 'hero',
          title: 'Novo título',
          image_media_id: 'm1',
          image_alt: 'Alt da seção',
          media: media('m1', 'abc'),
        }),
      ],
    });
    const image = content.sections[0].image!;
    expect(content.sections[0].title).toBe('Novo título');
    expect(image.alt).toBe('Alt da seção');
    expect(image.srcSet).toMatch(/abc-sm\.webp 800w, .*abc-lg\.webp 1600w/);
  });

  it('aceita só opções de texto ou liga/desliga', () => {
    const content = mapContent({
      ...emptyRows,
      sections: [
        section({
          id: 'form',
          type: 'formulario',
          options: { showDate: true, dateLabel: 'Data do evento', estranho: { a: 1 }, lista: [1] },
        }),
      ],
    });
    expect(content.sections[0].options).toEqual({ showDate: true, dateLabel: 'Data do evento' });
  });

  it('descarta fotos da galeria sem imagem', () => {
    const content = mapContent({
      ...emptyRows,
      sections: [section({ id: 'gal', type: 'galeria' })],
      items: [
        item({ id: 'g1', section_id: 'gal', media_id: 'm1', media: media('m1', 'x') }),
        item({ id: 'g2', section_id: 'gal', position: 1 }),
      ],
    });
    expect(content.sections[0].items).toHaveLength(1);
    expect(content.sections[0].items[0].image?.alt).toBe('g1');
  });
});
