/**
 * Monitoramento de erros (Sentry), opcional: só funciona com VITE_SENTRY_DSN definida.
 * A biblioteca é carregada depois que a página termina de carregar, para não pesar
 * no site; erros anteriores ficam em fila e são enviados assim que ela chega.
 *
 * Privacidade: não envia IP, cookies, e-mail nem o que foi digitado em formulários.
 */
type Sentry = typeof import('@sentry/react');

const DSN = ((import.meta.env.VITE_SENTRY_DSN as string | undefined) ?? '').trim();
export const isMonitoringEnabled = Boolean(DSN) && import.meta.env.PROD;

let sentry: Sentry | null = null;
let loading: Promise<Sentry | null> | null = null;
const queue: { error: unknown; context?: Record<string, unknown> }[] = [];

function load(): Promise<Sentry | null> {
  if (!isMonitoringEnabled) return Promise.resolve(null);
  loading ??= import('@sentry/react')
    .then((mod) => {
      mod.init({
        dsn: DSN,
        environment: window.location.hostname,
        sendDefaultPii: false,
        tracesSampleRate: 0,
        // Ignora ruído comum: extensões de navegador e falhas de rede do visitante.
        ignoreErrors: ['ResizeObserver loop', 'Non-Error promise rejection captured', /^Failed to fetch$/],
        denyUrls: [/^chrome-extension:\/\//, /^moz-extension:\/\//, /^safari-web-extension:\/\//],
        beforeSend(event) {
          delete event.user;
          if (event.request) {
            delete event.request.cookies;
            delete event.request.data;
          }
          return event;
        },
      });
      sentry = mod;
      for (const item of queue.splice(0)) mod.captureException(item.error, { extra: item.context });
      return mod;
    })
    .catch(() => null);
  return loading;
}

/** Inicia o monitoramento quando o navegador estiver ocioso. */
export function initMonitoring() {
  if (!isMonitoringEnabled) return;
  const start = () => void load();
  if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 5000 });
  else setTimeout(start, 3000);
}

/** Registra um erro inesperado. Sem DSN, só aparece no console. */
export function reportError(error: unknown, context?: Record<string, unknown>) {
  console.error(error);
  if (!isMonitoringEnabled) return;
  if (sentry) sentry.captureException(error, { extra: context });
  else {
    queue.push({ error, context });
    void load();
  }
}
