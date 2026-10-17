import { ExternalLink, Monitor, RotateCw, Smartphone, X } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { openPreview, previewUrl } from '../../../lib/preview';
import styles from './LivePreview.module.css';

interface Target {
  id: number;
  anchor: string;
}

interface ContextValue {
  /** Painel aberto: as telas gravam o rascunho a cada alteração e o site embutido se atualiza. */
  open: boolean;
  /** Seção do site da tela atual ('' = topo). undefined: a tela não tem pré-visualização. */
  anchor: string | undefined;
  show: () => void;
  hide: () => void;
  register: (anchor: string) => () => void;
}

const LivePreviewContext = createContext<ContextValue>({
  open: false,
  anchor: undefined,
  show: () => {},
  hide: () => {},
  register: () => () => {},
});

let nextId = 0;

export function LivePreviewProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [targets, setTargets] = useState<Target[]>([]);

  const register = useCallback((anchor: string) => {
    const id = ++nextId;
    setTargets((list) => [...list, { id, anchor }]);
    return () => setTargets((list) => list.filter((t) => t.id !== id));
  }, []);

  const value = useMemo<ContextValue>(
    () => ({
      open,
      anchor: targets.at(-1)?.anchor,
      show: () => setOpen(true),
      hide: () => setOpen(false),
      register,
    }),
    [open, targets, register],
  );

  return <LivePreviewContext.Provider value={value}>{children}</LivePreviewContext.Provider>;
}

export function useLivePreview() {
  return useContext(LivePreviewContext);
}

/** Informa ao painel qual parte do site a tela atual edita. */
export function usePreviewTarget(anchor: string | undefined) {
  const { register } = useLivePreview();
  useEffect(() => (anchor === undefined ? undefined : register(anchor)), [anchor, register]);
}

type Device = 'mobile' | 'desktop';
const DEVICE_WIDTH: Record<Device, number> = { mobile: 390, desktop: 1280 };

/**
 * Site embutido no painel com as alterações ainda não salvas. Fica ao lado do formulário em telas
 * largas e ocupa a tela inteira no celular. O site lê o rascunho do localStorage (ver lib/preview).
 */
export function LivePreviewPanel() {
  const { open, anchor, hide } = useLivePreview();
  const [device, setDevice] = useState<Device>(() =>
    typeof window !== 'undefined' && window.innerWidth >= 1280 ? 'desktop' : 'mobile',
  );
  const [reloadKey, setReloadKey] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = stageRef.current;
    if (!open || !el) return;
    const measure = () => setStage({ width: el.clientWidth, height: el.clientHeight });
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, anchor]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && hide();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, hide]);

  if (!open || anchor === undefined) return null;

  const width = DEVICE_WIDTH[device];
  const scale = stage.width ? Math.min(1, stage.width / width) : 1;

  return (
    <aside className={styles.panel} aria-labelledby="live-preview-title" data-tour="live-preview">
      <div className={styles.header}>
        <h2 id="live-preview-title">Pré-visualização</h2>
        <div className={styles.tools}>
          <div className={styles.devices} role="group" aria-label="Tamanho da tela">
            <button type="button" aria-pressed={device === 'mobile'} onClick={() => setDevice('mobile')}>
              <Smartphone aria-hidden="true" /> Celular
            </button>
            <button type="button" aria-pressed={device === 'desktop'} onClick={() => setDevice('desktop')}>
              <Monitor aria-hidden="true" /> Computador
            </button>
          </div>
          <button
            type="button"
            className={styles.icon}
            onClick={() => setReloadKey((k) => k + 1)}
            aria-label="Recarregar a pré-visualização"
            title="Recarregar"
          >
            <RotateCw aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.icon}
            onClick={() => openPreview(anchor)}
            aria-label="Abrir a pré-visualização em outra aba"
            title="Abrir em outra aba"
          >
            <ExternalLink aria-hidden="true" />
          </button>
          <button type="button" className={styles.icon} onClick={hide} aria-label="Fechar a pré-visualização">
            <X aria-hidden="true" />
          </button>
        </div>
      </div>
      <p className={styles.hint}>Mostra as alterações enquanto você edita, antes de salvar. Só você vê.</p>
      <div ref={stageRef} className={styles.stage}>
        {stage.width > 0 && (
          <iframe
            key={reloadKey}
            title="Pré-visualização do site"
            src={previewUrl(anchor, true)}
            className={styles.frame}
            style={{
              width,
              height: stage.height / scale,
              transform: `scale(${scale})`,
              left: Math.max(0, (stage.width - width * scale) / 2),
            }}
          />
        )}
      </div>
    </aside>
  );
}
