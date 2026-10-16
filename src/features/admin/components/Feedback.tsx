import { CheckCircle2, TriangleAlert, X } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '../../../components/Button/Button';
import styles from './Feedback.module.css';

// ---------------- Toasts ----------------

type ToastKind = 'success' | 'error';
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ConfirmOptions {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface FeedbackContextValue {
  notify: (kind: ToastKind, message: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pending, setPending] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const notify = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++;
      setToasts((t) => [...t.slice(-2), { id, kind, message }]);
      // Erros ficam até serem fechados; sucessos somem sozinhos.
      if (kind === 'success') setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ ...options, resolve })),
    [],
  );

  const close = (value: boolean) => {
    pending?.resolve(value);
    setPending(null);
  };

  return (
    <FeedbackContext.Provider value={{ notify, confirm }}>
      {children}
      <div className={styles.toasts} role="region" aria-label="Avisos" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${styles.toast} ${styles[t.kind]}`}
            role={t.kind === 'error' ? 'alert' : 'status'}
          >
            {t.kind === 'success' ? <CheckCircle2 aria-hidden="true" /> : <TriangleAlert aria-hidden="true" />}
            <p>{t.message}</p>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Fechar aviso">
              <X aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      {pending && <ConfirmDialog {...pending} onClose={close} />}
    </FeedbackContext.Provider>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger,
  onClose,
}: ConfirmOptions & { onClose: (value: boolean) => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal?.();
  }, []);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      onCancel={(e) => {
        e.preventDefault();
        onClose(false);
      }}
    >
      <h2 id="confirm-title">{title}</h2>
      <div id="confirm-message" className={styles.dialogBody}>
        {message}
      </div>
      <div className={styles.dialogActions}>
        <Button variant="outline" onClick={() => onClose(false)} autoFocus>
          {cancelLabel}
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={() => onClose(true)}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback deve ser usado dentro de FeedbackProvider');
  return ctx;
}
