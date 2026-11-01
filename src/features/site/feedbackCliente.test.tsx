import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { defaultContent } from '../../content/defaultContent';
import { SiteContentProvider } from '../../hooks/useSiteContent';
import { HomePage } from '../../pages/HomePage';
import type { ImageRef, Section, SectionItem, SiteContent } from '../../types/content';
import { describeRatio, heroCrop, heroFormat } from './heroImage';
import { sectionTheme } from './sectionThemes';

const photo = (n: number): ImageRef => ({
  mediaId: `m${n}`,
  src: `/images/foto-${n}.webp`,
  srcSet: `/images/foto-${n}-800.webp 800w, /images/foto-${n}.webp 1600w`,
  alt: `Foto ${n}`,
  width: 1600,
  height: 1200,
});

const photoItem = (n: number): SectionItem => ({
  id: `foto-${n}`,
  title: '',
  description: '',
  label: '',
  image: photo(n),
  photos: [],
  rating: 5,
});

function withSection(slug: string, patch: Partial<Section>): SiteContent {
  return {
    ...defaultContent,
    sections: defaultContent.sections.map((s) => (s.slug === slug ? { ...s, ...patch } : s)),
  };
}

async function renderHome(content: SiteContent) {
  const view = render(
    <SiteContentProvider loader={async () => content}>
      <HomePage />
    </SiteContentProvider>,
  );
  await act(async () => {});
  return view;
}

afterEach(() => {
  // @ts-expect-error o jsdom não tem matchMedia; um teste o cria.
  delete window.matchMedia;
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Carrossel de fotos em "Texto com imagem"', () => {
  const content = () =>
    withSection('sabores', {
      options: { imagePosition: 'direita', imageFit: 'cortada', carouselSeconds: '4' },
      items: [photoItem(1), photoItem(2)],
    });

  it('com fotos na lista, mostra a foto da seção e as da lista em carrossel, com lazy loading e srcset', async () => {
    await renderHome(content());
    const carousel = screen.getByRole('region', { name: /Fotos: Sorvete servido na hora/ });
    const slides = within(carousel).getAllByRole('group', { hidden: true });
    expect(slides).toHaveLength(3);
    const images = carousel.querySelectorAll('img');
    expect(images[1]).toHaveAttribute('alt', 'Foto 1');
    expect(images[1]).toHaveAttribute('srcset', expect.stringContaining('800w'));
    // Fora da tela ninguém é adiantado; na tela, só a atual e a próxima.
    expect(images[2]).toHaveAttribute('loading', expect.stringMatching(/lazy|eager/));
    expect(within(carousel).getByRole('button', { name: 'Foto anterior' })).toBeInTheDocument();
    expect(within(carousel).getByRole('button', { name: 'Próxima foto' })).toBeInTheDocument();
  });

  it('troca sozinha no tempo escolhido, para ao passar o mouse e pelo botão de pausar', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    await renderHome(content());
    const carousel = screen.getByRole('region', { name: /Fotos:/ });
    const dot = (n: number) => within(carousel).getByRole('button', { name: `Ir para a foto ${n}` });

    expect(dot(1)).toHaveAttribute('aria-current', 'true');
    act(() => vi.advanceTimersByTime(4000));
    expect(dot(2)).toHaveAttribute('aria-current', 'true');

    fireEvent.mouseEnter(carousel);
    act(() => vi.advanceTimersByTime(10000));
    expect(dot(2)).toHaveAttribute('aria-current', 'true');
    fireEvent.mouseLeave(carousel);

    fireEvent.click(within(carousel).getByRole('button', { name: 'Pausar a troca automática das fotos' }));
    act(() => vi.advanceTimersByTime(10000));
    expect(dot(2)).toHaveAttribute('aria-current', 'true');

    // Botões navegam em volta: da última para a primeira.
    fireEvent.click(within(carousel).getByRole('button', { name: 'Próxima foto' }));
    fireEvent.click(within(carousel).getByRole('button', { name: 'Próxima foto' }));
    expect(dot(1)).toHaveAttribute('aria-current', 'true');
  });

  it('com "reduzir movimento" ligado, começa parado', async () => {
    window.matchMedia = vi.fn(
      (query: string) =>
        ({
          matches: query.includes('reduce'),
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as unknown as MediaQueryList,
    );
    vi.useFakeTimers({ shouldAdvanceTime: false });
    await renderHome(content());
    const carousel = screen.getByRole('region', { name: /Fotos:/ });
    expect(within(carousel).getByRole('button', { name: 'Trocar as fotos automaticamente' })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(20000));
    expect(within(carousel).getByRole('button', { name: 'Ir para a foto 1' })).toHaveAttribute('aria-current', 'true');
  });

  it('sem fotos na lista, continua com a foto única', async () => {
    await renderHome(defaultContent);
    expect(screen.queryByRole('region', { name: /Fotos:/ })).not.toBeInTheDocument();
  });

  it('mostra o botão do WhatsApp quando a seção tem texto de botão', async () => {
    await renderHome(withSection('sabores', { ctaLabel: 'Pedir pelo WhatsApp' }));
    const link = screen.getByRole('link', { name: 'Pedir pelo WhatsApp' });
    expect(link).toHaveAttribute('href', expect.stringContaining('wa.me'));
    expect(link).toHaveAttribute('data-wa-origem', 'sabores');
  });
});

describe('Cor de fundo da seção', () => {
  it('roxo açaí envolve a seção numa faixa com data-tema', async () => {
    const { container } = await renderHome(withSection('sabores', { options: { theme: 'acai' } }));
    const band = container.querySelector('[data-tema="acai"]');
    expect(band).not.toBeNull();
    expect(band?.querySelector('section#sabores')).not.toBeNull();
  });

  it('ignora cores desconhecidas e tipos sem cor de fundo', () => {
    expect(sectionTheme('texto_imagem', 'acai')).toBe('acai');
    expect(sectionTheme('texto_imagem', 'padrao')).toBeNull();
    expect(sectionTheme('texto_imagem', 'verde')).toBeNull();
    expect(sectionTheme('hero', 'acai')).toBeNull();
    expect(sectionTheme('formulario', 'acai')).toBeNull();
  });
});

describe('Foto do topo', () => {
  it('formato e ponto de foco vão para a moldura da foto', async () => {
    const { container } = await renderHome({
      ...defaultContent,
      sections: defaultContent.sections.map((s) =>
        s.type === 'hero' ? { ...s, options: { ...s.options, imageFormat: 'vertical', imageFocus: 'topo' } } : s,
      ),
    });
    const figure = container.querySelector('figure[data-formato]');
    expect(figure).toHaveAttribute('data-formato', 'vertical');
    expect(figure).toHaveAttribute('data-foco', 'topo');
  });

  it('sem opções, usa horizontal 5:4 e centro', async () => {
    const { container } = await renderHome(defaultContent);
    const figure = container.querySelector('figure[data-formato]');
    expect(figure).toHaveAttribute('data-formato', 'horizontal');
    expect(figure).toHaveAttribute('data-foco', 'centro');
  });

  it('calcula o corte de cada proporção', () => {
    const horizontal = heroFormat('horizontal');
    expect(heroCrop(1600, 1280, horizontal)).toEqual({ side: null, hidden: 0 });
    const wide = heroCrop(1600, 900, horizontal);
    expect(wide.side).toBe('laterais');
    expect(Math.round(wide.hidden * 100)).toBe(30);
    const tall = heroCrop(1200, 1600, horizontal);
    expect(tall.side).toBe('topo e base');
    expect(Math.round(tall.hidden * 100)).toBe(40);
    expect(heroCrop(1280, 1600, heroFormat('vertical')).side).toBeNull();
    expect(heroFormat('outro').value).toBe('horizontal');
    expect(describeRatio(1600, 900)).toBe('16:9');
    expect(describeRatio(1200, 1600)).toBe('3:4');
  });
});
