import { ArrowLeft, ArrowRight, Crop, ImageOff, ImagePlus, Images, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../../../components/Button/Button';
import { listMedia, type MediaRow } from '../../../services/adminService';
import { mediaThumb } from '../media';
import { toFriendlyError } from '../../../services/errors';
import { FREE_PRESETS, type CropPreset } from '../cropPresets';
import { CropDialog } from './CropDialog';
import { MediaUploader } from './MediaUploader';
import styles from './Media.module.css';

interface PickerProps {
  label: string;
  help?: string;
  media: MediaRow | null;
  /** `preset`: proporção usada, quando a imagem acabou de ser recortada. */
  onChange: (media: MediaRow | null, preset?: CropPreset) => void;
  /** Permite deixar a seção sem imagem. */
  optional?: boolean;
  /** Proporções do editor de recorte; a primeira é a do lugar onde a foto aparece no site. */
  crop?: CropPreset[];
}

/**
 * Campo de imagem: mostra a atual e permite trocar (biblioteca ou novo envio). Ao escolher uma foto,
 * abre o editor de recorte; "Ajustar recorte" reabre o editor para a foto já escolhida.
 */
export function ImagePicker({ label, help, media, onChange, optional = false, crop = FREE_PRESETS }: PickerProps) {
  const [open, setOpen] = useState(false);
  const [cropping, setCropping] = useState<MediaRow | null>(null);

  return (
    <div className={styles.picker} data-tour="image-picker">
      <p className={styles.pickerLabel}>{label}</p>
      {help && <p className={styles.rules}>{help}</p>}
      <div className={styles.pickerBody}>
        {media ? (
          <img src={mediaThumb(media)} alt={media.alt} className={styles.pickerThumb} />
        ) : (
          <div className={`${styles.pickerThumb} ${styles.pickerEmpty}`}>
            <ImageOff aria-hidden="true" />
            <span>Sem imagem</span>
          </div>
        )}
        <div className={styles.actions}>
          <Button variant="outline" size="sm" icon={<Images aria-hidden="true" />} onClick={() => setOpen(true)}>
            {media ? 'Trocar imagem' : 'Escolher imagem'}
          </Button>
          {media && (
            <Button variant="outline" size="sm" icon={<Crop aria-hidden="true" />} onClick={() => setCropping(media)}>
              Ajustar recorte
            </Button>
          )}
          {optional && media && (
            <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
              Remover imagem
            </Button>
          )}
        </div>
      </div>
      {open && (
        <MediaLibraryDialog
          title={label}
          selectedId={media?.id}
          onClose={() => setOpen(false)}
          onSelect={(m) => {
            onChange(m);
            setOpen(false);
            setCropping(m);
          }}
        />
      )}
      {cropping && (
        <CropDialog
          media={cropping}
          presets={crop}
          onClose={() => setCropping(null)}
          onApplied={(m, preset) => {
            onChange(m, preset);
            setCropping(null);
          }}
        />
      )}
    </div>
  );
}

interface ListPickerProps {
  label: string;
  help?: string;
  /** Imagens escolhidas, na ordem exibida no site. */
  items: MediaRow[];
  max: number;
  onChange: (items: MediaRow[]) => void;
  crop?: CropPreset[];
}

/** Várias imagens em ordem (ex.: fotos do evento de um depoimento): adicionar, reordenar e remover. */
export function ImageListPicker({ label, help, items, max, onChange, crop = FREE_PRESETS }: ListPickerProps) {
  const [open, setOpen] = useState(false);
  /** Foto sendo recortada (o recorte entra no lugar dela, na mesma posição). */
  const [cropping, setCropping] = useState<MediaRow | null>(null);
  const full = items.length >= max;

  function move(index: number, delta: -1 | 1) {
    const next = [...items];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    onChange(next);
  }

  return (
    <div className={styles.picker}>
      <p className={styles.pickerLabel}>
        {label}{' '}
        <span className={styles.count}>
          ({items.length} de {max})
        </span>
      </p>
      {help && <p className={styles.rules}>{help}</p>}
      {items.length > 0 && (
        <ol className={styles.photoList}>
          {items.map((m, i) => (
            <li key={m.id}>
              <img src={mediaThumb(m)} alt={m.alt} />
              <div className={styles.photoTools}>
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label={`Mover a foto ${i + 1} para a esquerda`}
                >
                  <ArrowLeft aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === items.length - 1}
                  aria-label={`Mover a foto ${i + 1} para a direita`}
                >
                  <ArrowRight aria-hidden="true" />
                </button>
                <button type="button" onClick={() => setCropping(m)} aria-label={`Ajustar o recorte da foto ${i + 1}`}>
                  <Crop aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(items.filter((x) => x.id !== m.id))}
                  aria-label={`Remover a foto ${i + 1}`}
                >
                  <X aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className={styles.actions}>
        <Button
          variant="outline"
          size="sm"
          icon={<ImagePlus aria-hidden="true" />}
          onClick={() => setOpen(true)}
          disabled={full}
        >
          {full ? `Limite de ${max} fotos` : 'Adicionar foto'}
        </Button>
      </div>
      {open && (
        <MediaLibraryDialog
          title={label}
          onClose={() => setOpen(false)}
          onSelect={(m) => {
            if (!items.some((x) => x.id === m.id)) {
              onChange([...items, m]);
              setCropping(m);
            }
            setOpen(false);
          }}
        />
      )}
      {cropping && (
        <CropDialog
          media={cropping}
          presets={crop}
          onClose={() => setCropping(null)}
          onApplied={(m) => {
            const replaced = items.some((x) => x.id === cropping.id)
              ? items.map((x) => (x.id === cropping.id ? m : x))
              : [...items, m];
            onChange(replaced.filter((x, i, all) => all.findIndex((y) => y.id === x.id) === i));
            setCropping(null);
          }}
        />
      )}
    </div>
  );
}

interface DialogProps {
  title: string;
  selectedId?: string;
  onSelect: (media: MediaRow) => void;
  onClose: () => void;
}

export function MediaLibraryDialog({ title, selectedId, onSelect, onClose }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useState<MediaRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ref.current?.showModal?.();
    listMedia()
      .then(setItems)
      .catch((e) => setError(toFriendlyError(e)));
  }, []);

  return (
    <dialog
      ref={ref}
      className={styles.libraryDialog}
      aria-labelledby="library-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className={styles.libraryHeader}>
        <h2 id="library-title">{title}</h2>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar">
          <X aria-hidden="true" />
        </button>
      </div>

      <section aria-labelledby="upload-title" className={styles.librarySection}>
        <h3 id="upload-title">Enviar nova imagem</h3>
        <MediaUploader onUploaded={onSelect} />
      </section>

      <section aria-labelledby="existing-title" className={styles.librarySection}>
        <h3 id="existing-title">Ou escolha uma imagem já enviada</h3>
        {error && <p className={styles.error}>{error}</p>}
        {!items && !error && <p role="status">Carregando imagens…</p>}
        {items && items.length === 0 && <p>Nenhuma imagem enviada ainda.</p>}
        {items && items.length > 0 && (
          <ul className={styles.libraryGrid}>
            {items.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  className={styles.libraryItem}
                  aria-pressed={m.id === selectedId}
                  onClick={() => onSelect(m)}
                >
                  <img src={mediaThumb(m)} alt="" loading="lazy" />
                  <span>{m.alt || m.original_name || 'Sem descrição'}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </dialog>
  );
}
