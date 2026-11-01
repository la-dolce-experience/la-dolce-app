import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ResponsiveImage } from '../../components/ResponsiveImage/ResponsiveImage';
import type { ImageRef } from '../../types/content';
import styles from './Sections.module.css';

interface Props {
  images: ImageRef[];
  /** Nome do carrossel para leitores de tela (ex.: título da seção). */
  label: string;
  /** Classe da moldura (a mesma da foto única, para manter altura e cantos). */
  frameClassName: string;
  /** Largura exibida de cada foto, para o navegador escolher a variante (sm ou lg). */
  sizes: (image: ImageRef) => string;
  /** Tempo de cada foto, em milissegundos. */
  interval: number;
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
const prefersReducedMotion = () => window.matchMedia?.(REDUCED_MOTION).matches === true;

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia?.(REDUCED_MOTION);
  query?.addEventListener?.('change', onChange);
  return () => query?.removeEventListener?.('change', onChange);
}

function subscribeVisibility(onChange: () => void) {
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
}

const noSubscription = () => () => {};

/**
 * Fotos que trocam sozinhas, uma por vez (padrão de carrossel acessível do WAI-ARIA APG):
 * - pausa com o mouse em cima, com o foco do teclado dentro, fora da tela e com a aba em segundo plano;
 * - botão de pausar/tocar, anterior/próxima e pontos;
 * - com "reduzir movimento" ligado no aparelho, começa parado (a pessoa pode tocar se quiser);
 * - no celular, arrastar para os lados (rolagem horizontal com encaixe, sem biblioteca);
 * - fotos com lazy loading: só a atual e a seguinte são carregadas antes de aparecer.
 */
export function PhotoCarousel({ images, label, frameClassName, sizes, interval }: Props) {
  const count = images.length;
  const trackRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  /** Foto para onde uma troca programada está indo: a rolagem intermediária não muda o ponto ativo. */
  const targetRef = useRef<{ index: number; until: number } | null>(null);
  const [active, setActive] = useState(0);
  /** Escolha da pessoa no botão de pausar/tocar; sem escolha, segue a preferência de movimento do aparelho. */
  const [choice, setChoice] = useState<boolean | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(false);
  // Na pré-renderização (servidor) vale o padrão: tocando, fora da tela, aba visível.
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => false);
  const pageVisible = useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState !== 'hidden',
    () => true,
  );
  const canObserve = useSyncExternalStore(
    noSubscription,
    () => typeof IntersectionObserver !== 'undefined',
    () => true,
  );
  const visible = canObserve ? inView : true;
  const playing = choice ?? !reducedMotion;

  const running = playing && !hovered && !focused && visible && pageVisible && count > 1;

  const goTo = useCallback(
    (index: number) => {
      const next = (index + count) % count;
      setActive(next);
      const track = trackRef.current;
      if (!track) return;
      targetRef.current = { index: next, until: Date.now() + 1000 };
      track.scrollTo?.({ left: next * track.clientWidth, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    },
    [count],
  );

  // Arrastar no celular: o ponto ativo acompanha a foto que ficou na tela.
  function onScroll() {
    const track = trackRef.current;
    if (!track || !track.clientWidth) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    const target = targetRef.current;
    if (target) {
      if (index !== target.index && Date.now() < target.until) return;
      targetRef.current = null;
    }
    if (index !== active && index >= 0 && index < count) setActive(index);
  }

  // Troca automática: o tempo recomeça a cada mudança de foto (inclusive pelos botões ou ao arrastar).
  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => goTo(active + 1), interval);
    return () => window.clearTimeout(timer);
  }, [running, active, interval, goTo]);

  // Só troca (e só adianta a próxima foto) enquanto aparece na tela.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !canObserve) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.25 });
    observer.observe(root);
    return () => observer.disconnect();
  }, [canObserve]);

  // Ao mudar a largura da tela, mantém a foto atual enquadrada.
  useEffect(() => {
    const onResize = () => {
      const track = trackRef.current;
      if (track) track.scrollTo?.({ left: active * track.clientWidth, behavior: 'auto' });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [active]);

  return (
    <div
      ref={rootRef}
      className={styles.photoCarousel}
      role="region"
      aria-roledescription="carrossel"
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <div className={frameClassName}>
        {/* Enquanto troca sozinho, o leitor de tela não anuncia cada foto (aria-live off). */}
        {/* Rolável: também pelo teclado (com o foco aqui, as setas trocam a foto). */}
        <div
          ref={trackRef}
          className={styles.photoTrack}
          onScroll={onScroll}
          aria-live={running ? 'off' : 'polite'}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
            e.preventDefault();
            goTo(active + (e.key === 'ArrowRight' ? 1 : -1));
          }}
        >
          {images.map((image, i) => (
            <div
              key={`${image.mediaId ?? image.src}-${i}`}
              role="group"
              aria-roledescription="foto"
              aria-label={`${i + 1} de ${count}`}
              aria-hidden={i === active ? undefined : true}
            >
              <ResponsiveImage
                image={image}
                sizes={sizes(image)}
                eager={visible && (i === active || i === (active + 1) % count)}
              />
            </div>
          ))}
        </div>
      </div>
      <div className={styles.carouselControls}>
        <button
          type="button"
          className={styles.carouselButton}
          onClick={() => setChoice(!playing)}
          aria-label={playing ? 'Pausar a troca automática das fotos' : 'Trocar as fotos automaticamente'}
        >
          {playing ? (
            <Pause aria-hidden="true" className={styles.pauseIcon} />
          ) : (
            <Play aria-hidden="true" className={styles.pauseIcon} />
          )}
        </button>
        <button
          type="button"
          className={styles.carouselButton}
          onClick={() => goTo(active - 1)}
          aria-label="Foto anterior"
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <ol className={styles.dots}>
          {images.map((image, i) => (
            <li key={`${image.mediaId ?? image.src}-${i}`}>
              <button
                type="button"
                aria-label={`Ir para a foto ${i + 1}`}
                aria-current={i === active ? 'true' : undefined}
                onClick={() => goTo(i)}
              />
            </li>
          ))}
        </ol>
        <button
          type="button"
          className={styles.carouselButton}
          onClick={() => goTo(active + 1)}
          aria-label="Próxima foto"
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
