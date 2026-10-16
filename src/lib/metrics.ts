/**
 * Contagem anônima de visitas e cliques no WhatsApp, gravada no Supabase (função track_event).
 * Sem cookies, IP ou identificadores: só o tipo do evento, a origem e a hora.
 *
 * Não conta: quem está logado no painel neste navegador, a pré-visualização e o ambiente de desenvolvimento.
 */
import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from './env';
import { isPreviewMode } from './preview';

export type EventKind = 'visit' | 'whatsapp_click';

/** Origem dos cliques no WhatsApp; o mesmo valor vai no atributo data-wa-origem dos links. */
export const WHATSAPP_SOURCES = {
  botao_flutuante: 'Botão flutuante',
  destaque: 'Destaque principal',
  personalizacao: 'Personalização',
  formulario: 'Formulário de orçamento',
  atendimento: 'Atendimento e localização',
  rodape: 'Rodapé',
} as const;
export type WhatsAppSource = keyof typeof WHATSAPP_SOURCES;

const VISIT_KEY = 'la-dolce:visita-registrada';

function isAdminBrowser(): boolean {
  try {
    return Object.keys(localStorage).some((k) => /^sb-.+-auth-token$/.test(k));
  } catch {
    return false;
  }
}

function enabled(): boolean {
  if (!isSupabaseConfigured || !import.meta.env.PROD) return false;
  if (isPreviewMode()) return false;
  return !isAdminBrowser();
}

/** Envia o evento sem atrasar a navegação (keepalive). Falhas são ignoradas: é só estatística. */
export function trackEvent(kind: EventKind, source?: string) {
  if (!enabled()) return;
  void fetch(`${SUPABASE_URL}/rest/v1/rpc/track_event`, {
    method: 'POST',
    keepalive: true,
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_kind: kind, p_source: source ?? null }),
  }).catch(() => {});
}

/** Uma visita por sessão do navegador (abrir em outra aba no mesmo dia não conta de novo). */
export function trackVisit() {
  try {
    if (sessionStorage.getItem(VISIT_KEY)) return;
    sessionStorage.setItem(VISIT_KEY, '1');
  } catch {
    // Navegação privada sem sessionStorage: conta mesmo assim.
  }
  trackEvent('visit');
}

/** Registra cliques em qualquer link do WhatsApp marcado com data-wa-origem. Retorna a função de limpeza. */
export function listenWhatsAppClicks(root: Document = document): () => void {
  const onClick = (e: MouseEvent) => {
    const link = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[data-wa-origem]');
    if (link) trackEvent('whatsapp_click', link.dataset.waOrigem);
  };
  root.addEventListener('click', onClick, { capture: true });
  return () => root.removeEventListener('click', onClick, { capture: true });
}
