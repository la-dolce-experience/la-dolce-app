import { X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/Button/Button';
import { TOUR_STEPS } from './steps';
import styles from './GuidedTour.module.css';

/** Abaixo desta largura o balão vira uma folha presa ao topo ou ao rodapé da tela. */
const MOBILE_WIDTH = 640;
const GAP = 12;
const MARGIN = 16;
const SPOT_PADDING = 6;

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Props {
  /** Chamado ao concluir, pular ou fechar o tour. */
  onClose: () => void;
  /** Tempo máximo esperando a tela carregar o elemento destacado. */
  findTimeoutMs?: number;
}

function visibleElement(selector?: string): HTMLElement | null {
  if (!selector) return null;
  const el = document.querySelector<HTMLElement>(selector);
  // Elementos com display: none (ex.: menu lateral fechado no celular) não têm caixas.
  return el && el.getClientRects().length > 0 ? el : null;
}

const sameBox = (a: Box | null, b: Box | null) =>
  a === b || (!!a && !!b && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height);

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

function scrollToTarget(el: HTMLElement) {
  // Elementos altos vão para o topo da tela, deixando espaço para o balão embaixo.
  const tall = el.getBoundingClientRect().height > window.innerHeight * 0.45;
  el.scrollIntoView?.({ block: tall ? 'start' : 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
}

function inViewport(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < window.innerHeight;
}

/** Novas conferências depois que a tela termina de carregar (o conteúdo pode empurrar o elemento). */
const RECHECK_MS = [300, 800, 1500];

/**
 * Tour guiado pelo painel: a cada passo abre a tela correspondente, destaca o
 * elemento explicado e mostra um balão ao lado dele.
 */
export function GuidedTour({ onClose, findTimeoutMs = 5000 }: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [index, setIndex] = useState(0);
  const [found, setFound] = useState<{ index: number; el: HTMLElement | null } | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const step = TOUR_STEPS[index];
  const total = TOUR_STEPS.length;
  const isLast = index === total - 1;
  const ready = found?.index === index;
  const target = ready ? found.el : null;

  // 1. Abre a tela do passo.
  useEffect(() => {
    if (pathname !== step.route) navigate(step.route);
  }, [pathname, step.route, navigate]);

  // 2. Espera o elemento aparecer (as telas carregam dados do banco) e rola até ele.
  useEffect(() => {
    if (pathname !== step.route) return;
    const started = Date.now();
    const timers: number[] = [];
    const lookup = () => visibleElement(step.target) ?? visibleElement(step.fallbackTarget);
    const recheck = (previous: HTMLElement) => {
      const el = lookup();
      if (!el) return;
      // A tela pode recriar o elemento ao carregar os dados, ou empurrá-lo para fora da vista.
      if (el !== previous) setFound({ index, el });
      if (!inViewport(el)) scrollToTarget(el);
    };
    const find = () => {
      const el = lookup();
      if (el || !step.target || Date.now() - started > findTimeoutMs) {
        if (el) {
          scrollToTarget(el);
          for (const ms of RECHECK_MS) timers.push(window.setTimeout(() => recheck(el), ms));
        }
        setFound({ index, el });
        return;
      }
      timers.push(window.setTimeout(find, 50));
    };
    timers.push(window.setTimeout(find, 0));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [index, pathname, step, findTimeoutMs]);

  // 3. Acompanha a posição do elemento (rolagem suave, redimensionamento, conteúdo carregando).
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const r = target?.getBoundingClientRect();
      const next = r
        ? {
            top: r.top - SPOT_PADDING,
            left: r.left - SPOT_PADDING,
            width: r.width + SPOT_PADDING * 2,
            height: r.height + SPOT_PADDING * 2,
          }
        : null;
      setBox((prev) => (sameBox(prev, next) ? prev : next));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  // 4. Posiciona o balão no primeiro lado do destaque com espaço livre; se nenhum couber,
  //    onde ele cobrir a menor parte do destaque.
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    card.style.top = '';
    card.style.left = '';
    if (!box) {
      card.dataset.placement = 'center';
      return;
    }
    if (vw < MOBILE_WIDTH) {
      // Destaques altos rolam até o topo da tela (scrollToTarget): a folha vai para baixo, deixando o início visível.
      const tall = box.height > vh * 0.45;
      card.dataset.placement = !tall && box.top + box.height / 2 > vh / 2 ? 'sheet-top' : 'sheet-bottom';
      return;
    }
    const { width: w, height: h } = card.getBoundingClientRect();
    const clampX = (x: number) => Math.min(Math.max(x, MARGIN), vw - w - MARGIN);
    const clampY = (y: number) => Math.min(Math.max(y, MARGIN), vh - h - MARGIN);
    const below = box.top + box.height + GAP;
    const above = box.top - GAP - h;
    const right = box.left + box.width + GAP;
    const left = box.left - GAP - w;
    const options = [
      { fits: below + h <= vh - MARGIN, top: below, left: clampX(box.left) },
      { fits: above >= MARGIN, top: above, left: clampX(box.left) },
      { fits: right + w <= vw - MARGIN, top: clampY(box.top), left: right },
      { fits: left >= MARGIN, top: clampY(box.top), left },
    ];
    const covered = ({ top, left: x }: { top: number; left: number }) =>
      Math.max(0, Math.min(x + w, box.left + box.width) - Math.max(x, box.left)) *
      Math.max(0, Math.min(top + h, box.top + box.height) - Math.max(top, box.top));
    const corners = [MARGIN, vh - h - MARGIN].flatMap((top) =>
      [MARGIN, vw - w - MARGIN].map((x) => ({ top, left: x })),
    );
    const fallbacks = [...options.map((o) => ({ top: clampY(o.top), left: clampX(o.left) })), ...corners];
    const best = options.find((o) => o.fits) ?? fallbacks.reduce((min, o) => (covered(o) < covered(min) ? o : min));
    card.dataset.placement = 'float';
    // Nunca fora da tela, mesmo que o destaque esteja (ex.: durante a rolagem).
    card.style.top = `${clampY(best.top)}px`;
    card.style.left = `${clampX(best.left)}px`;
  }, [box, ready, index]);

  // 5. A cada passo, o foco vai para o título: leitores de tela anunciam o novo conteúdo.
  useEffect(() => {
    if (ready) titleRef.current?.focus({ preventScroll: true });
  }, [ready, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div id="tour" className={styles.tour}>
      {/* Impede cliques no painel durante o tour; o teclado já está bloqueado com `inert`. */}
      <div className={styles.blocker} aria-hidden="true" />
      {box ? (
        <div
          className={styles.spotlight}
          style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
          aria-hidden="true"
        />
      ) : (
        <div className={styles.backdrop} aria-hidden="true" />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        className={styles.card}
        data-ready={ready}
      >
        <div className={styles.head}>
          <div className={styles.top}>
            <p className={styles.progress}>
              Passo {index + 1} de {total}
            </p>
            <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar tour">
              <X aria-hidden="true" />
            </button>
          </div>
          <div className={styles.bar} aria-hidden="true">
            <span style={{ width: `${((index + 1) / total) * 100}%` }} />
          </div>
        </div>

        {/* Só o texto rola: o título do passo e os botões ficam sempre visíveis, mesmo no celular. */}
        <div className={styles.scroll}>
          <h2 id="tour-title" ref={titleRef} tabIndex={-1}>
            {step.title}
          </h2>
          <div id="tour-body" className={styles.body}>
            {step.body}
          </div>
        </div>

        <div className={styles.actions}>
          {index === 0 ? (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Pular tour
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIndex((i) => i - 1)}>
              Voltar
            </Button>
          )}
          <Button size="sm" onClick={() => (isLast ? onClose() : setIndex((i) => i + 1))}>
            {isLast ? 'Concluir' : 'Próximo'}
          </Button>
        </div>
      </div>
    </div>
  );
}
