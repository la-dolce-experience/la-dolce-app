import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { setInitialContent } from './hooks/useSiteContent';
import { routes } from './routes';
import { fetchSiteContent } from './services/contentService';
import type { SiteContent } from './types/content';

/**
 * Pré-renderiza a página inicial com o conteúdo publicado. Roda só no build (scripts/prerender.mjs):
 * o HTML já chega com textos e fotos, para o Google e para quem abre o site no celular.
 * Mesma árvore de rotas do navegador (App), para a hidratação encontrar o mesmo HTML.
 */
export async function prerender(): Promise<{ html: string; content: SiteContent } | null> {
  const content = await fetchSiteContent();
  if (!content) return null;
  setInitialContent(content);
  const router = createMemoryRouter(routes, { initialEntries: ['/'] });
  const html = renderToString(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
  return { html, content };
}
