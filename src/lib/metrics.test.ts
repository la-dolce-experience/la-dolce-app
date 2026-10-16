// A contagem só roda no site publicado: os testes simulam esse ambiente.
async function loadMetrics() {
  vi.resetModules();
  vi.stubEnv('PROD', true);
  vi.stubEnv('VITE_SUPABASE_URL', 'https://exemplo.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'chave-publica');
  return import('./metrics');
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
  vi.stubGlobal('fetch', fetchMock);
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

const sentBodies = () => fetchMock.mock.calls.map(([, init]) => JSON.parse((init as RequestInit).body as string));

describe('métricas anônimas', () => {
  it('registra uma visita por sessão', async () => {
    const { trackVisit } = await loadMetrics();
    trackVisit();
    trackVisit();
    expect(sentBodies()).toEqual([{ p_kind: 'visit', p_source: null }]);
    expect(fetchMock.mock.calls[0][0]).toBe('https://exemplo.supabase.co/rest/v1/rpc/track_event');
  });

  it('registra cliques em links do WhatsApp com a origem', async () => {
    const { listenWhatsAppClicks } = await loadMetrics();
    document.body.innerHTML =
      '<a href="https://wa.me/55" data-wa-origem="rodape"><span id="icone">x</span></a><a id="outro" href="/">y</a>';
    const stop = listenWhatsAppClicks();
    document.getElementById('icone')!.click();
    document.getElementById('outro')!.click();
    stop();
    document.getElementById('icone')!.click();
    expect(sentBodies()).toEqual([{ p_kind: 'whatsapp_click', p_source: 'rodape' }]);
  });

  it('não conta quem está conectado ao painel nem a pré-visualização', async () => {
    const { trackEvent } = await loadMetrics();
    localStorage.setItem('sb-exemplo-auth-token', '{}');
    trackEvent('visit');
    localStorage.clear();
    window.history.replaceState(null, '', '/?previa=1');
    trackEvent('visit');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('não envia nada fora do site publicado', async () => {
    vi.resetModules();
    vi.stubEnv('PROD', false);
    const { trackEvent } = await import('./metrics');
    trackEvent('visit');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
