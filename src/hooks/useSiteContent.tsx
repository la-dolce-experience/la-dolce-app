import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { defaultContent } from '../content/defaultContent';
import { isPreviewMode, PREVIEW_STORAGE_KEY } from '../lib/preview';
import { fetchPreviewContent, fetchSiteContent } from '../services/contentService';
import type { SiteContent } from '../types/content';

export type ContentStatus = 'loading' | 'ready' | 'fallback';

interface ContextValue {
  content: SiteContent;
  status: ContentStatus;
}

const SiteContentContext = createContext<ContextValue>({ content: defaultContent, status: 'fallback' });

/** Tempo máximo de espera pelo banco antes de exibir o conteúdo padrão. */
const TIMEOUT_MS = 4000;

/** Id do <script type="application/json"> com o conteúdo usado na pré-renderização da página. */
export const INITIAL_CONTENT_ID = 'conteudo-inicial';

let initialContent: SiteContent | null = null;

/** Define o conteúdo inicial (usado pela pré-renderização no build, onde não há HTML para ler). */
export function setInitialContent(content: SiteContent | null) {
  initialContent = content;
}

/**
 * Conteúdo que veio pronto no HTML pré-renderizado: a página abre já com ele, sem esperar o banco.
 * Na pré-visualização ele não vale, porque o rascunho do painel é diferente do publicado.
 */
function readInitialContent(): SiteContent | null {
  if (initialContent) return initialContent;
  if (typeof document === 'undefined' || isPreviewMode()) return null;
  const el = document.getElementById(INITIAL_CONTENT_ID);
  if (!el?.textContent) return null;
  try {
    initialContent = JSON.parse(el.textContent) as SiteContent;
  } catch {
    return null;
  }
  return initialContent;
}

interface ProviderProps {
  children: ReactNode;
  /** Permite injetar a função de busca (testes). */
  loader?: () => Promise<SiteContent | null>;
}

const defaultLoader = () => (isPreviewMode() ? fetchPreviewContent() : fetchSiteContent());

export function SiteContentProvider({ children, loader = defaultLoader }: ProviderProps) {
  const [state, setState] = useState<ContextValue>(() => {
    const initial = readInitialContent();
    return initial ? { content: initial, status: 'ready' } : { content: defaultContent, status: 'loading' };
  });
  // Na pré-visualização, cada mudança no rascunho (outra aba, o painel) recarrega o conteúdo.
  const [draftVersion, setDraftVersion] = useState(0);

  useEffect(() => {
    if (!isPreviewMode()) return;
    const onStorage = (e: StorageEvent) => e.key === PREVIEW_STORAGE_KEY && setDraftVersion((v) => v + 1);
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    let active = true;
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS));

    // Sem resposta do banco, mantém o conteúdo que já está na tela, se veio pronto no HTML.
    const fallback = (prev: ContextValue): ContextValue =>
      prev.status === 'ready' ? prev : { content: defaultContent, status: 'fallback' };

    Promise.race([loader(), timeout])
      .then((content) => {
        if (!active) return;
        // Conteúdo igual ao pré-renderizado: nada a atualizar.
        setState((prev) =>
          !content
            ? fallback(prev)
            : JSON.stringify(content) === JSON.stringify(prev.content) && prev.status === 'ready'
              ? prev
              : { content, status: 'ready' },
        );
      })
      .catch((error: unknown) => {
        // Supabase pausado/indisponível: o site continua no ar com o conteúdo padrão.
        console.warn('[conteúdo] usando conteúdo padrão:', error instanceof Error ? error.message : error);
        if (active) setState(fallback);
      });

    return () => {
      active = false;
    };
  }, [loader, draftVersion]);

  return <SiteContentContext.Provider value={state}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  return useContext(SiteContentContext);
}
