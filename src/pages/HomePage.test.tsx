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
      'Seu evento, com a sua cara.',
      'Vamos criar uma experiência inesquecível?',
      'Onde atendemos',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument();
    }
    // Seções sem conteúdo real ficam ocultas.
    expect(screen.queryByRole('heading', { name: 'Perguntas frequentes' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Quem já viveu a experiência' })).not.toBeInTheDocument();
  });

  it('todas as imagens têm texto alternativo', async () => {
    const { container } = renderHome();
    await screen.findByRole('heading', { level: 1 });
    for (const img of container.querySelectorAll('img')) expect(img).toHaveAttribute('alt');
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

  it('mostra o conteúdo do banco quando disponível', async () => {
    const custom: SiteContent = {
      ...defaultContent,
      sections: {
        ...defaultContent.sections,
        hero: { ...defaultContent.sections.hero, title: 'Título vindo do painel' },
      },
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
        'Convidados (estimativa): 150',
        'Descrição: Lançamento de produto.\nCom logo da empresa.',
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
});
