import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { defaultContent } from '../content/defaultContent';
import { fetchSiteContent } from '../services/contentService';
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

export function SiteContentProvider({ children, loader = fetchSiteContent }: ProviderProps) {
  const [state, setState] = useState<ContextValue>({ content: defaultContent, status: 'loading' });

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
  }, [loader]);

  return <SiteContentContext.Provider value={state}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  return useContext(SiteContentContext);
}
