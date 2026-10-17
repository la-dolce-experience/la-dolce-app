import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { GuidedTour } from './GuidedTour';
import { HelpMenu } from './HelpMenu';
import { TOUR_STEPS } from './steps';

function CurrentPath() {
  return <p data-testid="path">{useLocation().pathname}</p>;
}

function renderTour(onClose = vi.fn()) {
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="*" element={<CurrentPath />} />
      </Routes>
      {/* Os elementos destacados não existem aqui: sem espera, o balão aparece centralizado. */}
      <GuidedTour onClose={onClose} findTimeoutMs={0} />
    </MemoryRouter>,
  );
  return onClose;
}

const title = (i: number) => screen.findByRole('heading', { level: 2, name: TOUR_STEPS[i].title });
/** O foco vai para o título quando a tela do passo termina de carregar. */
const expectFocusOn = (i: number) =>
  waitFor(() => expect(screen.getByRole('heading', { level: 2, name: TOUR_STEPS[i].title })).toHaveFocus());

describe('Tour guiado', () => {
  // Percorre todos os passos, cada um esperando a tela: leva mais que os 5 s padrão em máquinas lentas (CI).
  it('abre a tela de cada passo e conclui no último', async () => {
    const user = userEvent.setup();
    const onClose = renderTour();

    expect(screen.getByRole('dialog')).toHaveAccessibleName(TOUR_STEPS[0].title);
    await expectFocusOn(0);

    for (let i = 1; i < TOUR_STEPS.length; i++) {
      await user.click(screen.getByRole('button', { name: 'Próximo' }));
      await expectFocusOn(i);
      expect(screen.getByTestId('path')).toHaveTextContent(TOUR_STEPS[i].route);
      expect(screen.getByText(`Passo ${i + 1} de ${TOUR_STEPS.length}`)).toBeInTheDocument();
    }
    expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Concluir' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  }, 20_000);

  it('passa por todas as áreas do painel', () => {
    const routes = new Set(TOUR_STEPS.map((s) => s.route));
    for (const route of ['/admin', '/admin/secoes/hero', '/admin/secoes/events', '/admin/imagens', '/admin/contato']) {
      expect(routes).toContain(route);
    }
    expect(routes).toContain('/admin/seo');
    expect(routes).toContain('/admin/conta');
  });

  it('volta ao passo anterior e à tela dele', async () => {
    const user = userEvent.setup();
    renderTour();
    const events = TOUR_STEPS.findIndex((s) => s.route === '/admin/secoes/events');
    for (let i = 0; i < events; i++) await user.click(screen.getByRole('button', { name: 'Próximo' }));
    expect(screen.getByTestId('path')).toHaveTextContent('/admin/secoes/events');
    await user.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(await title(events - 1)).toBeInTheDocument();
    expect(screen.getByTestId('path')).toHaveTextContent(TOUR_STEPS[events - 1].route);
  });

  it.each(['Pular tour', 'Fechar tour'])('"%s" encerra o tour', async (label) => {
    const user = userEvent.setup();
    const onClose = renderTour();
    await user.click(screen.getByRole('button', { name: label }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Esc encerra o tour', async () => {
    const user = userEvent.setup();
    const onClose = renderTour();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('Menu Ajuda', () => {
  it('abre o menu e permite refazer o tour', async () => {
    const user = userEvent.setup();
    const onOpenGuide = vi.fn();
    render(<HelpMenu onOpenGuide={onOpenGuide} />);

    const toggle = screen.getByRole('button', { name: 'Ajuda' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('button', { name: 'Refazer o tour do painel' }));
    expect(onOpenGuide).toHaveBeenCalledTimes(1);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('com alterações não salvas, o tour fica indisponível e o motivo é explicado', async () => {
    const user = userEvent.setup();
    render(<HelpMenu onOpenGuide={() => {}} guideDisabled />);
    await user.click(screen.getByRole('button', { name: 'Ajuda' }));
    const button = screen.getByRole('button', { name: 'Refazer o tour do painel' });
    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleDescription('Salve ou descarte as alterações antes de refazer o tour.');
  });
});
