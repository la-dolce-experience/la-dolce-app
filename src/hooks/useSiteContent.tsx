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

interface ProviderProps {
  children: ReactNode;
  /** Permite injetar a função de busca (testes). */
  loader?: () => Promise<SiteContent | null>;
}

const defaultLoader = () => (isPreviewMode() ? fetchPreviewContent() : fetchSiteContent());

export function SiteContentProvider({ children, loader = defaultLoader }: ProviderProps) {
  const [state, setState] = useState<ContextValue>({ content: defaultContent, status: 'loading' });
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

    Promise.race([loader(), timeout])
      .then((content) => {
        if (!active) return;
        setState(content ? { content, status: 'ready' } : { content: defaultContent, status: 'fallback' });
      })
      .catch((error: unknown) => {
        // Supabase pausado/indisponível: o site continua no ar com o conteúdo padrão.
        console.warn('[conteúdo] usando conteúdo padrão:', error instanceof Error ? error.message : error);
        if (active) setState({ content: defaultContent, status: 'fallback' });
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
