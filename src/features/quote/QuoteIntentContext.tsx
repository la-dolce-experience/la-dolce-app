import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface QuoteIntent {
  /** Assunto escolhido em outra seção (ex.: link de um cartão). */
  subject: string;
  /** Incrementa a cada pedido, para o formulário reagir mesmo se o tipo for o mesmo. */
  version: number;
  requestQuote: (subject: string) => void;
}

const QuoteIntentContext = createContext<QuoteIntent>({ subject: '', version: 0, requestQuote: () => {} });

export function QuoteIntentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({ subject: '', version: 0 });
  const requestQuote = useCallback((subject: string) => {
    setState((s) => ({ subject, version: s.version + 1 }));
  }, []);
  const value = useMemo(() => ({ ...state, requestQuote }), [state, requestQuote]);
  return <QuoteIntentContext.Provider value={value}>{children}</QuoteIntentContext.Provider>;
}

export function useQuoteIntent() {
  return useContext(QuoteIntentContext);
}
