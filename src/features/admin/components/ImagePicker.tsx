import { ImageOff, Images, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../../../components/Button/Button';
import { listMedia, type MediaRow } from '../../../services/adminService';
import { mediaThumb } from '../media';
import { toFriendlyError } from '../../../services/errors';
import { MediaUploader } from './MediaUploader';
import styles from './Media.module.css';

interface PickerProps {
  label: string;
  help?: string;
  media: MediaRow | null;
  onChange: (media: MediaRow | null) => void;
  /** Permite deixar a seção sem imagem. */
  optional?: boolean;
}

/** Campo de imagem: mostra a atual e permite trocar (biblioteca ou novo envio). */
export function ImagePicker({ label, help, media, onChange, optional = false }: PickerProps) {
  const [open, setOpen] = useState(false);

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
