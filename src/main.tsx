import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initMonitoring, reportError } from './lib/monitoring';
import './styles/global.css';

initMonitoring();

// Erros fora da renderização (ex.: em eventos e promessas) também são registrados.
window.addEventListener('error', (e) => e.error && reportError(e.error, { origem: 'window.error' }));
window.addEventListener('unhandledrejection', (e) => reportError(e.reason, { origem: 'unhandledrejection' }));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
