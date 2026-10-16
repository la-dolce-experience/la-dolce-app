import { useCallback, useEffect, useState } from 'react';

/** Carrega dados assíncronos com estados de carregamento e erro. `loader` deve ser estável. */
export function useLoad<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    loader().then(
      (result) => {
        if (!active) return;
        setData(result);
        setLoading(false);
      },
      (e: unknown) => {
        if (!active) return;
        setError(e);
        setLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, [loader, attempt]);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  return { data, setData, error, loading, reload };
}

/** Estado de formulário com detecção de alterações em relação ao valor salvo. */
export function useFormState<T extends object>(initial: T | null = null) {
  const [saved, setSaved] = useState<T | null>(initial);
  const [values, setValues] = useState<T | null>(initial);

  const set = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((v) => (v ? { ...v, [key]: value } : v));
  }, []);

  /** Define um novo valor salvo (após carregar ou salvar com sucesso). */
  const reset = useCallback((next: T) => {
    setSaved(next);
    setValues(next);
  }, []);

  const discard = useCallback(() => setValues(saved), [saved]);
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);

  return { values, set, setValues, reset, discard, dirty };
}
