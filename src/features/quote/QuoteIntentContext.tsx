import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface QuoteIntent {
  /** Tipo de evento escolhido em outra seção (ex.: card "Eventos corporativos"). */
  eventType: string;
  /** Incrementa a cada pedido, para o formulário reagir mesmo se o tipo for o mesmo. */
  version: number;
  requestQuote: (eventType: string) => void;
}

const QuoteIntentContext = createContext<QuoteIntent>({ eventType: '', version: 0, requestQuote: () => {} });

export function QuoteIntentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({ eventType: '', version: 0 });
  const requestQuote = useCallback((eventType: string) => {
    setState((s) => ({ eventType, version: s.version + 1 }));
  }, []);
  const value = useMemo(() => ({ ...state, requestQuote }), [state, requestQuote]);
  return <QuoteIntentContext.Provider value={value}>{children}</QuoteIntentContext.Provider>;
}

export function useQuoteIntent() {
  return useContext(QuoteIntentContext);
}
