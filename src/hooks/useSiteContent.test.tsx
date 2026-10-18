import { render, screen, waitFor } from '@testing-library/react';
import { defaultContent } from '../content/defaultContent';
import type { SiteContent } from '../types/content';
import { INITIAL_CONTENT_ID, setInitialContent, SiteContentProvider, useSiteContent } from './useSiteContent';

function Probe() {
  const { content, status } = useSiteContent();
  return (
    <p>
      {status}: {content.settings.businessName}
    </p>
  );
}

const withName = (businessName: string): SiteContent => ({
  ...defaultContent,
  settings: { ...defaultContent.settings, businessName },
});

/** Simula o <script> que a pré-renderização grava no HTML. */
function embed(content: SiteContent) {
  const el = document.createElement('script');
  el.id = INITIAL_CONTENT_ID;
  el.type = 'application/json';
  el.textContent = JSON.stringify(content);
  document.body.appendChild(el);
}

afterEach(() => {
  document.getElementById(INITIAL_CONTENT_ID)?.remove();
  setInitialContent(null);
  window.history.replaceState(null, '', '/');
});

describe('Conteúdo pré-renderizado', () => {
  it('abre já pronto com o conteúdo do HTML e atualiza se o banco tiver uma versão mais nova', async () => {
    embed(withName('Do HTML'));
    let resolve!: (c: SiteContent) => void;
    render(
      <SiteContentProvider loader={() => new Promise((r) => (resolve = r))}>
        <Probe />
      </SiteContentProvider>,
    );
    expect(screen.getByText('ready: Do HTML')).toBeInTheDocument();

    resolve(withName('Do banco'));
    expect(await screen.findByText('ready: Do banco')).toBeInTheDocument();
  });

  it('mantém o conteúdo do HTML quando o banco falha, em vez de voltar ao padrão', async () => {
    embed(withName('Do HTML'));
    const loader = vi.fn().mockRejectedValue(new Error('fora do ar'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <SiteContentProvider loader={loader}>
        <Probe />
      </SiteContentProvider>,
    );
    await waitFor(() => expect(loader).toHaveBeenCalled());
    expect(screen.getByText('ready: Do HTML')).toBeInTheDocument();
  });

  it('na pré-visualização ignora o HTML: o rascunho do painel é outro conteúdo', () => {
    embed(withName('Do HTML'));
    window.history.replaceState(null, '', '/?previa=1');
    render(
      <SiteContentProvider loader={() => new Promise(() => {})}>
        <Probe />
      </SiteContentProvider>,
    );
    expect(screen.getByText(`loading: ${defaultContent.settings.businessName}`)).toBeInTheDocument();
  });
});
