import { LoaderCircle, Minus, Plus, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { Button } from '../../../components/Button/Button';
import { getMedia, uploadMedia, type MediaRow } from '../../../services/adminService';
import { resolveMediaUrl } from '../../../services/contentService';
import { toFriendlyError } from '../../../services/errors';
import { cropToFile } from '../../../utils/cropImage';
import { ImageProcessingError, processImageFile } from '../../../utils/imageProcessing';
import type { CropPreset } from '../cropPresets';
import styles from './CropDialog.module.css';

interface Props {
  media: MediaRow;
  /** Proporções oferecidas; a primeira é a do lugar onde a foto aparece no site. */
  presets: CropPreset[];
  onApplied: (media: MediaRow, preset: CropPreset) => void;
  onClose: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.1;

interface SavedCrop {
  x: number;
  y: number;
  width: number;
  height: number;
  aspect: number | null;
}

function savedCrop(value: unknown): SavedCrop | null {
  if (!value || typeof value !== 'object') return null;
  const c = value as Record<string, unknown>;
  const nums = ['x', 'y', 'width', 'height'].every((k) => typeof c[k] === 'number');
  return nums ? (c as unknown as SavedCrop) : null;
}

const sameAspect = (a: number | null, b: number | null) =>
  a === null || b === null ? a === b : Math.abs(a - b) < 0.01;

/**
 * Editor de recorte (como o da foto de perfil do GitHub): arrastar para posicionar, zoom pelo controle,
 * pela roda do mouse, por pinça ou pelas teclas + e -, e setas para mover. Sempre recorta a partir da
 * imagem original: se a foto escolhida já é um recorte, abre a original com a área usada antes.
 * O recorte vira uma imagem NOVA na biblioteca (a original continua lá).
 */
export function CropDialog({ media, presets, onApplied, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const zoomId = useId();
  const [source, setSource] = useState<MediaRow | null>(null);
  const [initial, setInitial] = useState<{ preset: number; area: Area } | null>(null);
  const [presetIndex, setPresetIndex] = useState(0);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<{ percent: Area; pixels: Area } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // As opções vêm prontas de quem abre o editor; só a primeira lista conta para reabrir o recorte anterior.
  const presetsRef = useRef(presets);

  useEffect(() => {
    ref.current?.showModal?.();
  }, []);

  // Recorte de um recorte: volta para a original, com a mesma área e proporção.
  useEffect(() => {
    let active = true;
    const previous = savedCrop(media.crop);
    (media.source_media_id ? getMedia(media.source_media_id) : Promise.resolve(null)).then(
      (original) => {
        if (!active) return;
        setSource(original ?? media);
        if (original && previous) {
          const index = presetsRef.current.findIndex((p) => sameAspect(p.aspect, previous.aspect));
          if (index > -1) {
            setPresetIndex(index);
            setInitial({ preset: index, area: previous });
          }
        }
      },
      () => active && setSource(media),
    );
    return () => {
      active = false;
    };
  }, [media]);

  const preset = presets[presetIndex] ?? presets[0];
  const aspect = preset.aspect ?? (source ? source.width_lg / source.height_lg : 1);
  const src = source ? resolveMediaUrl(source.src_lg) : '';
  const changeZoom = (value: number) => setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value)));

  function onKeyDown(e: KeyboardEvent) {
    if (e.target instanceof HTMLInputElement) return;
    if (e.key === '+' || e.key === '=') changeZoom(zoom + ZOOM_STEP);
    else if (e.key === '-' || e.key === '_') changeZoom(zoom - ZOOM_STEP);
    else return;
    e.preventDefault();
  }

  async function apply() {
    if (!source || !area) return;
    setBusy(true);
    setError(null);
    try {
      const file = await cropToFile(src, area.pixels, source.original_name || source.alt);
      const processed = await processImageFile(file);
      const created = await uploadMedia(processed, media.alt || source.alt, file.name, {
        source_media_id: source.id,
        crop: { ...area.percent, aspect: preset.aspect },
      });
      onApplied(created, preset);
    } catch (e) {
      setError(e instanceof ImageProcessingError ? e.message : toFriendlyError(e));
      setBusy(false);
    }
  }

  // Prévia: a área recortada numa moldura com a mesma proporção.
  const previewImg = area
    ? {
        width: `${10000 / area.percent.width}%`,
        left: `${(-area.percent.x * 100) / area.percent.width}%`,
        top: `${(-area.percent.y * 100) / area.percent.height}%`,
      }
    : undefined;

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      onKeyDown={onKeyDown}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className={styles.header}>
        <h2 id={titleId}>Ajustar recorte</h2>
        <button type="button" className={styles.close} onClick={onClose} disabled={busy} aria-label="Fechar">
          <X aria-hidden="true" />
        </button>
      </div>

      <div className={styles.body}>
        <p className={styles.help}>
          Arraste a foto para posicionar. Para aproximar, use o controle abaixo, a roda do mouse, dois dedos ou as
          teclas + e −; as setas movem a foto. A original continua na biblioteca.
        </p>

        {presets.length > 1 && (
          <fieldset className={styles.presets}>
            <legend>Formato</legend>
            {presets.map((p, i) => (
              <label key={p.label} className={styles.preset}>
                <input
                  type="radio"
                  name={`${titleId}-preset`}
                  checked={i === presetIndex}
                  onChange={() => {
                    setPresetIndex(i);
                    setZoom(1);
                    setCrop({ x: 0, y: 0 });
                  }}
                />
                <span>{p.label}</span>
              </label>
            ))}
          </fieldset>
        )}

        <div className={styles.workspace}>
          <div className={styles.stage}>
            {source ? (
              <Cropper
                key={`${source.id}-${presetIndex}`}
                image={src}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                minZoom={MIN_ZOOM}
                maxZoom={MAX_ZOOM}
                onCropChange={setCrop}
                onZoomChange={changeZoom}
                onCropComplete={(percent, pixels) => setArea({ percent, pixels })}
                initialCroppedAreaPercentages={initial?.preset === presetIndex ? initial.area : undefined}
                mediaProps={{ crossOrigin: 'anonymous', alt: '' }}
                cropperProps={{
                  'aria-label': 'Área do recorte. Use as setas para mover a foto e + ou − para aproximar.',
                  role: 'group',
                }}
                keyboardStep={10}
                showGrid
              />
            ) : (
              <p className={styles.loading} role="status">
                <LoaderCircle className={styles.spin} aria-hidden="true" /> Abrindo a foto…
              </p>
            )}
          </div>

          <div className={styles.side}>
            <p className={styles.label}>Prévia</p>
            <div className={styles.preview} style={{ aspectRatio: String(aspect) }} data-testid="crop-preview">
              {previewImg && <img src={src} alt="" style={previewImg} crossOrigin="anonymous" />}
            </div>
            {area && (
              <p className={styles.size}>
                Recorte: {Math.round(area.pixels.width)} × {Math.round(area.pixels.height)} px
              </p>
            )}
          </div>
        </div>

        <div className={styles.zoom}>
          <label htmlFor={zoomId}>Zoom</label>
          <button
            type="button"
            className={styles.zoomButton}
            onClick={() => changeZoom(zoom - ZOOM_STEP)}
            aria-label="Afastar"
            disabled={zoom <= MIN_ZOOM}
          >
            <Minus aria-hidden="true" />
          </button>
          <input
            id={zoomId}
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => changeZoom(Number(e.target.value))}
            aria-valuetext={`${Math.round(zoom * 100)}%`}
          />
          <button
            type="button"
            className={styles.zoomButton}
            onClick={() => changeZoom(zoom + ZOOM_STEP)}
            aria-label="Aproximar"
            disabled={zoom >= MAX_ZOOM}
          >
            <Plus aria-hidden="true" />
          </button>
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>

      <div className={styles.footer}>
        <Button variant="outline" onClick={onClose} disabled={busy}>
          Cancelar
        </Button>
        <Button onClick={apply} disabled={!area || busy} aria-busy={busy}>
          {busy ? 'Aplicando…' : 'Aplicar recorte'}
        </Button>
      </div>
    </dialog>
  );
}
