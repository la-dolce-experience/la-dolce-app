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
  flavorItems: [],
  steps: [],
  gallery: [],
  faqs: [],
  testimonials: [],
};

const testimonial = {
  context: '',
  quote: 'x',
  media_id: null,
  photo_media_ids: [] as string[],
  rating: 5,
  visible: true,
};

describe('mapContent', () => {
  it('separa sabores e apresentações, na ordem e só os visíveis', () => {
    const flavor = { description: '', media_id: null, media: null, alt: '', visible: true };
    const content = mapContent({
      ...emptyRows,
      flavorItems: [
        { ...flavor, id: 'c', kind: 'apresentacao', title: 'Casquinha', position: 1 },
        { ...flavor, id: 'm', kind: 'sabor', title: 'Morango', position: 1 },
        { ...flavor, id: 'n', kind: 'sabor', title: 'Ninho', position: 0 },
        { ...flavor, id: 'o', kind: 'sabor', title: 'Oculto', position: 2, visible: false },
        {
          ...flavor,
          id: 'p',
          kind: 'apresentacao',
          title: 'Copinho',
          position: 0,
          media_id: 'm1',
          media: media('m1', 'copinho'),
        },
      ],
    });
    expect(content.flavors.map((f) => f.title)).toEqual(['Ninho', 'Morango']);
    expect(content.presentations.map((f) => f.title)).toEqual(['Copinho', 'Casquinha']);
    expect(content.presentations[0].image?.alt).toBe('Copinho');
    expect(content.presentations[1].image).toBeNull();
  });

  it('mantém a nota dos depoimentos entre 1 e 5 e usa a foto quando houver', () => {
    const content = mapContent({
      ...emptyRows,
      testimonials: [
        { ...testimonial, id: 'a', author: 'Ana', authorized: true, position: 0, rating: 9 },
        {
          ...testimonial,
          id: 'b',
          author: 'Bia',
          authorized: true,
          position: 1,
          rating: 3,
          media_id: 'm2',
          media: media('m2', 'bia'),
        },
      ],
    });
    expect(content.testimonials.map((t) => t.rating)).toEqual([5, 3]);
    expect(content.testimonials[0].image).toBeNull();
    expect(content.testimonials[1].image?.alt).toBe('Bia');
  });

  it('usa as fotos do evento na ordem escolhida, com texto alternativo', () => {
    const semAlt = { ...media('m4', 'b'), alt: '' };
    const content = mapContent({
      ...emptyRows,
      testimonials: [
        {
          ...testimonial,
          id: 'a',
          author: 'Ana',
          authorized: true,
          position: 0,
          photo_media_ids: ['m3', 'm4'],
          photos: [media('m3', 'a'), semAlt],
        },
        { ...testimonial, id: 'b', author: 'Bia', authorized: true, position: 1 },
      ],
    });
    expect(content.testimonials[0].photos.map((p) => p.mediaId)).toEqual(['m3', 'm4']);
    expect(content.testimonials[0].photos[1].alt).toBe('Foto do evento de Ana');
    expect(content.testimonials[1].photos).toEqual([]);
  });

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
        { ...testimonial, id: 't1', author: 'Sem autorização', authorized: false, position: 0 },
        { ...testimonial, id: 't2', author: 'Autorizado', authorized: true, position: 1 },
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
