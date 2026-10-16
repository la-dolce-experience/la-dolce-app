import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useBlocker } from 'react-router-dom';
import { useFeedback } from './Feedback';

/**
 * Registro de formulários com alterações não salvas. Cada formulário informa
 * se está "sujo"; o painel bloqueia a navegação e o fechamento da aba.
 */
interface Registry {
  setDirty: (key: string, dirty: boolean) => void;
  anyDirty: boolean;
}

const UnsavedContext = createContext<Registry>({ setDirty: () => {}, anyDirty: false });

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());

  const setDirty = useCallback((key: string, dirty: boolean) => {
    setDirtyKeys((prev) => {
      if (prev.has(key) === dirty) return prev;
      const next = new Set(prev);
      if (dirty) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ setDirty, anyDirty: dirtyKeys.size > 0 }), [setDirty, dirtyKeys]);
  return (
    <UnsavedContext.Provider value={value}>
      {children}
      <NavigationGuard when={value.anyDirty} />
    </UnsavedContext.Provider>
  );
}

function NavigationGuard({ when }: { when: boolean }) {
  const { confirm } = useFeedback();
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => when && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    confirm({
      title: 'Sair sem salvar?',
      message: 'Há alterações que ainda não foram salvas. Se sair agora, elas serão perdidas.',
      confirmLabel: 'Sair sem salvar',
      cancelLabel: 'Continuar editando',
      danger: true,
    }).then((ok) => (ok ? blocker.proceed() : blocker.reset()));
  }, [blocker, confirm]);

  useEffect(() => {
    if (!when) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [when]);

  return null;
}

/** Registra o estado "sujo" de um formulário enquanto ele estiver montado. */
export function useTrackDirty(key: string, dirty: boolean) {
  const { setDirty } = useContext(UnsavedContext);
  useEffect(() => {
    setDirty(key, dirty);
  }, [key, dirty, setDirty]);
  useEffect(() => () => setDirty(key, false), [key, setDirty]);
}

export function useAnyDirty() {
  return useContext(UnsavedContext).anyDirty;
}
