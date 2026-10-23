import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { defaultContent } from '../content/defaultContent';
import { SiteContentProvider } from '../hooks/useSiteContent';
import type { SiteContent } from '../types/content';
import { HomePage } from './HomePage';

function renderHome(loader: () => Promise<SiteContent | null> = async () => null) {
  return render(
    <SiteContentProvider loader={loader}>
      <HomePage />
    </SiteContentProvider>,
  );
}

let openSpy: ReturnType<typeof vi.spyOn>;
let nowSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
  nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1_000);
});

afterEach(() => vi.restoreAllMocks());

const flavor = {
  id: 'ninho',
  title: 'Ninho com Nutella',
  description: '',
  label: '',
  image: null,
  photos: [],
  rating: 5,
};

describe('Página inicial', () => {
  it('renderiza as seções com o conteúdo real e hierarquia de títulos correta', async () => {
    renderHome();
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      'A sorveteria mais desejada do seu evento.',
    );
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    for (const title of [
      'Uma experiência que vira assunto.',
      'Levamos a La Dolce Experience até você.',
      'Sorvete servido na hora, com presença de marca.',
      'Apresentações',
      'Seu evento, com a sua cara.',
      'Vamos criar uma experiência inesquecível?',
      'Onde atendemos',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument();
    }
    // Seções de lista ainda sem conteúdo real ficam ocultas.
    expect(screen.queryByRole('heading', { name: 'Perguntas frequentes' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Quem já viveu a experiência' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Sabores' })).not.toBeInTheDocument();
  });

  it('sabores e apresentações aparecem logo abaixo de "Sabores e apresentação"', async () => {
    const sections = defaultContent.sections.map((s) =>
      s.slug === 'lista-de-sabores' ? { ...s, items: [flavor] } : s,
    );
    const { container } = renderHome(async () => ({ ...defaultContent, sections }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Sabores' })).toBeInTheDocument();
    const ids = [...container.querySelectorAll('main > section[id]')].map((e) => e.id);
    const start = ids.indexOf('sabores');
    expect(ids.slice(start, start + 3)).toEqual(['sabores', 'lista-de-sabores', 'apresentacoes']);
    expect(screen.getByRole('heading', { level: 4, name: 'Ninho com Nutella' })).toBeInTheDocument();
  });

  it('mostra as seções na ordem definida no painel', async () => {
    const [hero, ...rest] = defaultContent.sections;
    const custom: SiteContent = { ...defaultContent, sections: [hero, ...rest.reverse()] };
    renderHome(async () => custom);
    await screen.findByRole('heading', { level: 1 });
    await waitFor(() => {
      const titles = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
      expect(titles.indexOf('Onde atendemos')).toBeLessThan(titles.indexOf('Uma experiência que vira assunto.'));
    });
  });

  it('esconde seções de lista sem itens', async () => {
    const sections = defaultContent.sections.map((s) => (s.type === 'galeria' ? { ...s, items: [] } : s));
    renderHome(async () => ({ ...defaultContent, sections }));
    await screen.findByRole('heading', { level: 1 });
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: 'Produto bonito antes mesmo da primeira colherada.' }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.queryByRole('link', { name: 'Galeria' })).not.toBeInTheDocument();
  });

  it('todas as imagens têm texto alternativo', async () => {
    const { container } = renderHome();
    await screen.findByRole('heading', { level: 1 });
    for (const img of container.querySelectorAll('img')) expect(img).toHaveAttribute('alt');
  });

  it('sem logotipo, mostra o nome do negócio', async () => {
    renderHome(async () => ({ ...defaultContent, settings: { ...defaultContent.settings, logo: null } }));
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'La Dolce Experience — início' })).toHaveTextContent(
        'La Dolce Experience',
      ),
    );
  });

  it('botão flutuante abre o WhatsApp com a mensagem inicial', async () => {
    renderHome();
    const link = await screen.findByRole('link', { name: /Conversar pelo WhatsApp/ });
    const url = new URL(link.getAttribute('href')!);
    expect(url.origin + url.pathname).toBe('https://wa.me/5511920102743');
    expect(url.searchParams.get('text')).toBe('Olá! Vim pelo site e quero tirar algumas dúvidas.');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('sem formulário na página, os botões principais levam ao WhatsApp', async () => {
    const sections = defaultContent.sections.filter((s) => s.type !== 'formulario');
    renderHome(async () => ({ ...defaultContent, sections }));
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: 'Vamos criar uma experiência inesquecível?' }),
      ).not.toBeInTheDocument(),
    );
    const hero = screen.getByRole('link', { name: 'Solicitar orçamento' });
    expect(hero.getAttribute('href')).toMatch(/^https:\/\/wa\.me\//);
    expect(screen.getAllByRole('link', { name: 'Fale conosco' })[0].getAttribute('href')).toMatch(
      /^https:\/\/wa\.me\//,
    );
  });

  it('mostra o conteúdo do banco quando disponível', async () => {
    const custom: SiteContent = {
      ...defaultContent,
      sections: defaultContent.sections.map((s) => (s.type === 'hero' ? { ...s, title: 'Título vindo do painel' } : s)),
    };
    renderHome(async () => custom);
    expect(await screen.findByRole('heading', { level: 1, name: 'Título vindo do painel' })).toBeInTheDocument();
  });

  it('continua no ar com o conteúdo padrão se a API/banco estiver indisponível', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderHome(() => Promise.reject(new Error('Failed to fetch')));
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('A sorveteria mais desejada');
    await waitFor(() => expect(screen.getByRole('main')).not.toHaveAttribute('aria-busy', 'true'));
    expect(warn).toHaveBeenCalled();
  });
});

describe('Menu móvel', () => {
  it('abre, fecha com Esc e devolve o foco ao botão', async () => {
    const user = userEvent.setup();
    renderHome();
    const toggle = await screen.findByRole('button', { name: 'Abrir menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const mobileNav = screen.getByRole('navigation', { name: 'Menu móvel' });
    expect(within(mobileNav).getByRole('link', { name: 'Galeria' })).toBeVisible();
    expect(within(mobileNav).getByRole('link', { name: 'Pedir orçamento' })).toHaveAttribute('href', '#orcamento');
    await user.keyboard('{Escape}');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();
  });
});

describe('Formulário de orçamento', () => {
  async function setup() {
    const user = userEvent.setup();
    renderHome();
    const form = (await screen.findByRole('heading', { name: 'Vamos criar uma experiência inesquecível?' })).closest(
      'section',
    )!;
    nowSpy.mockReturnValue(60_000); // simula o tempo de preenchimento de uma pessoa real
    const submit = within(form).getByRole('button', { name: /Solicitar orçamento pelo WhatsApp/ });
    return { user, form: within(form), submit };
  }

  it('mostra erros acessíveis, foca o primeiro campo e preserva o que foi digitado', async () => {
    const { user, form, submit } = await setup();
    await user.type(form.getByLabelText(/E-mail/), 'ana@exemplo.com');
    await user.click(submit);

    expect(form.getByRole('alert')).toHaveTextContent('Corrija os 3 campos destacados.');
    const name = form.getByLabelText(/^Nome/);
    expect(name).toHaveFocus();
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAccessibleDescription('Informe seu nome.');
    expect(form.getByLabelText(/E-mail/)).toHaveValue('ana@exemplo.com');
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('valida o telefone e aplica a máscara', async () => {
    const { user, form, submit } = await setup();
    const phone = form.getByLabelText(/WhatsApp para retorno/);
    await user.type(phone, '1198765');
    expect(phone).toHaveValue('(11) 9876-5');
    await user.type(form.getByLabelText(/^Nome/), 'Ana');
    await user.click(submit);
    expect(phone).toHaveAccessibleDescription(/Número inválido/);
  });

  it('abre o WhatsApp com a mensagem formatada e explica o próximo passo', async () => {
    const { user, form, submit } = await setup();
    await user.type(form.getByLabelText(/^Nome/), 'Ana Souza');
    await user.type(form.getByLabelText(/WhatsApp para retorno/), '11987654321');
    await user.selectOptions(form.getByLabelText(/Tipo de evento/), 'Evento corporativo');
    await user.type(form.getByLabelText(/convidados/), '150');
    await user.type(form.getByLabelText(/Conte um pouco/), 'Lançamento de produto.{enter}Com logo da empresa.');
    await user.click(submit);

    expect(openSpy).toHaveBeenCalledTimes(1);
    const url = new URL(openSpy.mock.calls[0][0] as string);
    expect(url.origin + url.pathname).toBe('https://wa.me/5511920102743');
    expect(url.searchParams.get('text')).toBe(
      [
        'Olá! Vim pelo site e gostaria de solicitar um orçamento.',
        '',
        'Nome: Ana Souza',
        'Contato: (11) 98765-4321',
        'Tipo de evento: Evento corporativo',
        'Nº estimado de convidados: 150',
        'Conte um pouco sobre o evento: Lançamento de produto.\nCom logo da empresa.',
        '',
        'Poderiam me orientar sobre os próximos passos?',
      ].join('\n'),
    );
    expect(form.getByRole('status')).toHaveTextContent(/toque em Enviar/);
    expect(form.getByRole('link', { name: 'Abrir o WhatsApp novamente' })).toHaveAttribute('href', url.toString());
    // Evita abrir várias conversas por clique duplo.
    expect(submit).toBeDisabled();
  });

  it('não abre nada quando o campo anti-spam é preenchido', async () => {
    const { user, form, submit } = await setup();
    await user.type(form.getByLabelText(/^Nome/), 'Bot');
    await user.type(form.getByLabelText(/WhatsApp para retorno/), '11987654321');
    await user.selectOptions(form.getByLabelText(/Tipo de evento/), 'Outros');
    await user.type(form.getByLabelText('Não preencha este campo'), 'http://spam');
    await user.click(submit);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('o cartão de tipo de evento pré-seleciona a opção no formulário', async () => {
    const { user, form } = await setup();
    await user.click(screen.getByRole('link', { name: /Pedir orçamento para feira ou exposição/ }));
    expect(form.getByLabelText(/Tipo de evento/)).toHaveValue('Feira ou exposição');
  });

  it('mostra só os campos ligados no painel, com os nomes escolhidos', async () => {
    const sections = defaultContent.sections.map((s) =>
      s.type === 'formulario'
        ? { ...s, options: { ...s.options, showDate: false, quantityLabel: 'Quantas pessoas' } }
        : s,
    );
    renderHome(async () => ({ ...defaultContent, sections }));
    const heading = await screen.findByRole('heading', { name: 'Vamos criar uma experiência inesquecível?' });
    const form = within(heading.closest('section')!);
    await waitFor(() => expect(form.getByLabelText(/Quantas pessoas/)).toBeInTheDocument());
    expect(form.queryByLabelText(/Data prevista/)).not.toBeInTheDocument();
  });
});
