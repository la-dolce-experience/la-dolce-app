import { Upload } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '../../../components/Button/Button';
import { uploadMedia, type MediaRow } from '../../../services/adminService';
import { toFriendlyError } from '../../../services/errors';
import {
  ACCEPTED_IMAGE_TYPES,
  ImageProcessingError,
  processImageFile,
  validateImageFile,
} from '../../../utils/imageProcessing';
import { useFeedback } from './Feedback';
import { TextField } from './Fields';
import styles from './Media.module.css';

interface Props {
  onUploaded: (media: MediaRow) => void;
}

/** Envio de nova imagem: escolha → pré-visualização → texto alternativo → envio. */
export function MediaUploader({ onUploaded }: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { notify } = useFeedback();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [alt, setAlt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [altError, setAltError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  function choose(next: File | undefined) {
    setError(null);
    if (!next) return;
    const invalid = validateImageFile(next);
    if (invalid) {
      setError(invalid);
      setFile(null);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setFile(next);
    setPreview(URL.createObjectURL(next));
  }

  function cancel() {
    setFile(null);
    setPreview(null);
    setAlt('');
    setError(null);
    setAltError(undefined);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function submit() {
    if (!file) return;
    if (alt.trim().length < 3) {
      setAltError('Descreva a imagem em poucas palavras (ex.: "Casquinha de morango com calda").');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const processed = await processImageFile(file);
      const media = await uploadMedia(processed, alt.trim(), file.name);
      notify('success', 'Imagem enviada.');
      cancel();
      onUploaded(media);
    } catch (e) {
      setError(e instanceof ImageProcessingError ? e.message : toFriendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.uploader}>
      <div className={styles.dropRow}>
        <label htmlFor={`${id}-file`} className={styles.fileLabel}>
          <Upload aria-hidden="true" />
          <span>{file ? 'Escolher outra imagem' : 'Escolher imagem do computador ou celular'}</span>
        </label>
        <input
          ref={inputRef}
          id={`${id}-file`}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          className="visually-hidden"
          onChange={(e) => choose(e.target.files?.[0])}
          aria-describedby={`${id}-rules`}
        />
        <p id={`${id}-rules`} className={styles.rules}>
          JPG, PNG ou WebP, até 10 MB. A imagem é otimizada automaticamente antes do envio.
        </p>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {file && preview && (
        <div className={styles.previewRow}>
          <img src={preview} alt="" className={styles.preview} />
          <div className={styles.previewForm}>
            <p className={styles.fileName}>
              Pré-visualização: <strong>{file.name}</strong> ({(file.size / 1024 / 1024).toFixed(1)} MB)
            </p>
            <TextField
              id={`${id}-alt`}
              label="Descrição da imagem (texto alternativo)"
              help="Lida por leitores de tela e pelo Google. Descreva o que aparece na foto."
              value={alt}
              onValueChange={(v) => {
                setAlt(v);
                setAltError(undefined);
              }}
              maxLength={200}
              required
              error={altError}
            />
            <div className={styles.actions}>
              <Button variant="outline" onClick={cancel} disabled={busy}>
                Cancelar
              </Button>
              <Button onClick={submit} disabled={busy} aria-busy={busy}>
                {busy ? 'Enviando…' : 'Enviar imagem'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
