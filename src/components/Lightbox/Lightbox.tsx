import { ChevronLeft, ChevronRight, Maximize, Minimize, X } from 'lucide-react';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import type { ImageRef } from '../../types/content';
import styles from './Lightbox.module.css';

export interface LightboxItem {
  id: string;
  image: ImageRef;
  caption?: string;
}

interface Props {
  items: LightboxItem[];
  /** Foto aberta primeiro. */
  start: number;
  onClose: () => void;
}

/** Distância mínima (px) de um arrasto horizontal para trocar de foto no celular. */
const SWIPE = 50;

/**
 * Fotos em tela cheia, em carrossel: setas, teclado (← →), arrasto no celular e miniaturas.
 * Usa <dialog> modal: o foco fica preso nele e Esc fecha.
 */
export function Lightbox({ items, start, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const thumbsRef = useRef<HTMLOListElement>(null);
  const swipeStart = useRef<number | null>(null);
  const [index, setIndex] = useState(start);
  const [fullscreen, setFullscreen] = useState(false);
  const canFullscreen = typeof document !== 'undefined' && !!document.fullscreenEnabled;
  const total = items.length;
  const item = items[index];

  const go = (delta: number) => setIndex((i) => (i + delta + total) % total);

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal?.();
    // A página atrás não rola enquanto as fotos estão abertas.
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    const onFullscreen = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => {
      root.style.overflow = previous;
      document.removeEventListener('fullscreenchange', onFullscreen);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      if (dialog?.open) dialog.close?.();
    };
  }, []);

  // Mantém a miniatura da foto atual visível.
  useEffect(() => {
    const thumb = thumbsRef.current?.children[index] as HTMLElement | undefined;
    thumb?.scrollIntoView?.({ block: 'nearest', inline: 'center' });
  }, [index]);

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else ref.current?.requestFullscreen?.().catch(() => {});
  }

  function onPointerDown(e: PointerEvent) {
    if (e.pointerType !== 'mouse') swipeStart.current = e.clientX;
  }

  function onPointerUp(e: PointerEvent) {
    if (swipeStart.current === null) return;
    const dx = e.clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(dx) > SWIPE) go(dx < 0 ? 1 : -1);
  }

  return (
    <dialog
      ref={ref}
      className={styles.lightbox}
      aria-label="Fotos da galeria"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(1);
        if (e.key === 'ArrowLeft') go(-1);
      }}
    >
      <div className={styles.top}>
        <p className={styles.counter} aria-live="polite">
          Foto {index + 1} de {total}
        </p>
        <div className={styles.tools}>
          {canFullscreen && (
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            >
              {fullscreen ? <Minimize aria-hidden="true" /> : <Maximize aria-hidden="true" />}
            </button>
          )}
          <button type="button" onClick={onClose} aria-label="Fechar fotos" autoFocus>
            <X aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        className={styles.stage}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipeStart.current = null)}
      >
        {total > 1 && (
          <button
            type="button"
            className={`${styles.nav} ${styles.prev}`}
            onClick={() => go(-1)}
            aria-label="Foto anterior"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
        )}
        <figure className={styles.figure}>
          <img
            key={item.id}
            src={item.image.src}
            srcSet={item.image.srcSet}
            sizes={item.image.srcSet ? '100vw' : undefined}
            alt={item.image.alt}
            draggable={false}
          />
          {item.caption && <figcaption>{item.caption}</figcaption>}
        </figure>
        {total > 1 && (
          <button
            type="button"
            className={`${styles.nav} ${styles.next}`}
            onClick={() => go(1)}
            aria-label="Próxima foto"
          >
            <ChevronRight aria-hidden="true" />
          </button>
        )}
      </div>

      {total > 1 && (
        <ol ref={thumbsRef} className={styles.thumbs} aria-label="Escolher foto">
          {items.map((it, i) => (
            <li key={it.id}>
              <button
                type="button"
                aria-current={i === index ? 'true' : undefined}
                aria-label={`Foto ${i + 1}: ${it.image.alt}`}
                onClick={() => setIndex(i)}
              >
                <img src={it.image.src} srcSet={it.image.srcSet} sizes="80px" alt="" loading="lazy" />
              </button>
            </li>
          ))}
        </ol>
      )}
    </dialog>
  );
}
