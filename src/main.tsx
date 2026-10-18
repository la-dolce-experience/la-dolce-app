import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { App } from './App';
import { INITIAL_CONTENT_ID } from './hooks/useSiteContent';
import { initMonitoring, reportError } from './lib/monitoring';
import { isPreviewMode } from './lib/preview';
import './styles/global.css';

initMonitoring();

// Erros fora da renderização (ex.: em eventos e promessas) também são registrados.
window.addEventListener('error', (e) => e.error && reportError(e.error, { origem: 'window.error' }));
window.addEventListener('unhandledrejection', (e) => reportError(e.reason, { origem: 'unhandledrejection' }));

const container = document.getElementById('root')!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Página inicial pré-renderizada no build: o React assume o HTML que já está na tela.
// Na pré-visualização o conteúdo é o rascunho do painel, diferente do HTML: monta do zero.
if (document.getElementById(INITIAL_CONTENT_ID) && window.location.pathname === '/' && !isPreviewMode()) {
  // Deixa o navegador pintar o HTML pronto antes de hidratar: no celular, a hidratação é a tarefa mais longa
  // e, rodando antes, atrasaria a primeira exibição da página e da foto do topo.
  requestAnimationFrame(() =>
    setTimeout(() =>
      hydrateRoot(container, app, {
        onRecoverableError: (error) => reportError(error, { origem: 'hidratacao' }),
      }),
    ),
  );
} else {
  container.replaceChildren();
  createRoot(container).render(app);
}
