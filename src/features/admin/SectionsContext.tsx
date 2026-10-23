import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { listSections, type SectionRow } from '../../services/adminService';
import { toFriendlyError } from '../../services/errors';

interface ContextValue {
  /** Todas as seções (inclusive ocultas), na ordem da página. null enquanto carrega. */
  sections: SectionRow[] | null;
  error: string | null;
  reload: () => void;
  /** Atualiza a lista local depois de uma gravação (menu e visão geral refletem na hora). */
  setSections: (update: (list: SectionRow[]) => SectionRow[]) => void;
}

const SectionsContext = createContext<ContextValue>({
  sections: null,
  error: null,
  reload: () => {},
  setSections: () => {},
});

/** Lista de seções compartilhada pelo menu lateral, a visão geral e a tela "Seções da página". */
export function SectionsProvider({ children }: { children: ReactNode }) {
  const [sections, setList] = useState<SectionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    listSections().then(
      (rows) => {
        if (!active) return;
        setList(rows);
        setError(null);
      },
      (e: unknown) => active && setError(toFriendlyError(e)),
    );
    return () => {
      active = false;
    };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  const setSections = useCallback(
    (update: (list: SectionRow[]) => SectionRow[]) => setList((list) => (list ? update(list) : list)),
    [],
  );

  const value = useMemo(() => ({ sections, error, reload, setSections }), [sections, error, reload, setSections]);
  return <SectionsContext.Provider value={value}>{children}</SectionsContext.Provider>;
}

export function useSections() {
  return useContext(SectionsContext);
}
