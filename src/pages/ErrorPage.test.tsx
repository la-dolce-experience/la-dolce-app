import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { isOutdatedBuildError } from '../utils/outdatedBuild';
import { ErrorPage } from './ErrorPage';

function Boom({ error }: { error: Error }): never {
  throw error;
}

function renderWithError(error: Error, area?: 'site' | 'admin') {
  const router = createMemoryRouter([
    { path: '/', element: <Boom error={error} />, errorElement: <ErrorPage area={area} /> },
  ]);
  render(<RouterProvider router={router} />);
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('Tela de erro', () => {
  it('mostra mensagem em português com opções para recarregar e voltar', () => {
    renderWithError(new Error('falha inesperada'));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Algo deu errado');
    expect(screen.getByRole('button', { name: 'Recarregar a página' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir para a página inicial' })).toHaveAttribute('href', '/');
    expect(document.title).toBe('Algo deu errado | La Dolce Experience');
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  });

  it('no painel, o botão secundário volta à Visão geral', () => {
    renderWithError(new Error('falha'), 'admin');
    expect(screen.getByRole('link', { name: 'Voltar à Visão geral' })).toHaveAttribute('href', '/admin');
  });

  it('explica quando o site foi atualizado com a página aberta', () => {
    renderWithError(new TypeError('Failed to fetch dynamically imported module: /assets/AdminApp-abc.js'));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('O site foi atualizado');
  });

  it('reconhece os erros de arquivo desatualizado dos principais navegadores', () => {
    expect(isOutdatedBuildError(new TypeError('Failed to fetch dynamically imported module: x'))).toBe(true);
    expect(isOutdatedBuildError(new TypeError('Importing a module script failed.'))).toBe(true);
    expect(isOutdatedBuildError(new TypeError('error loading dynamically imported module'))).toBe(true);
    expect(isOutdatedBuildError(new Error('Cannot read properties of undefined'))).toBe(false);
  });
});
