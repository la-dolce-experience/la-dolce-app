import { LoaderCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../components/Button/Button';
import { deleteMedia, getMediaUsage, listMedia, updateMediaAlt, type MediaRow } from '../../../services/adminService';
import { toFriendlyError } from '../../../services/errors';
import a from '../admin.module.css';
import { useFeedback } from '../components/Feedback';
import { TextField } from '../components/Fields';
import { mediaThumb } from '../media';
import { MediaUploader } from '../components/MediaUploader';
import { useTrackDirty } from '../components/UnsavedChanges';
import { useLoad } from '../hooks';
import { PageHeader } from './PageHeader';
import styles from './MediaPage.module.css';

export function MediaPage() {
  const { data, setData, error, loading, reload } = useLoad(listMedia);

  return (
    <>
      <PageHeader
        breadcrumb="Conteúdo"
        title="Biblioteca de imagens"
        description="Todas as fotos usadas no site. Envie novas imagens, ajuste as descrições ou exclua as que não usa mais."
      />

      <section className={a.panel} aria-labelledby="upload-heading" data-tour="media-upload">
        <div className={a.panelHeader}>
          <div>
            <h2 id="upload-heading">Enviar imagem</h2>
            <p>Depois de enviar, escolha a imagem na seção onde ela deve aparecer.</p>
          </div>
        </div>
        <MediaUploader onUploaded={(m) => setData((list) => [m, ...(list ?? [])])} />
      </section>

      <section className={a.panel} aria-labelledby="library-heading">
        <div className={a.panelHeader}>
          <div>
            <h2 id="library-heading">Imagens enviadas</h2>
            {data && <p>{data.length === 1 ? '1 imagem' : `${data.length} imagens`}</p>}
          </div>
        </div>
        {loading && (
          <p className={a.loading} role="status">
            <LoaderCircle className={a.spin} aria-hidden="true" /> Carregando…
          </p>
        )}
        {!!error && (
          <div className={`${a.notice} ${a.noticeError}`} role="alert">
            <p>{toFriendlyError(error)}</p>
            <Button size="sm" variant="outline" onClick={reload}>
              Tentar novamente
            </Button>
          </div>
        )}
        {data && data.length === 0 && <p className={a.empty}>Nenhuma imagem enviada ainda.</p>}
        {data && data.length > 0 && (
          <ul className={styles.grid}>
            {data.map((m) => (
              <MediaCard
                key={m.id}
                media={m}
                onUpdated={(next) => setData((list) => list!.map((x) => (x.id === next.id ? next : x)))}
                onDeleted={() => setData((list) => list!.filter((x) => x.id !== m.id))}
              />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function MediaCard({
  media,
  onUpdated,
  onDeleted,
}: {
  media: MediaRow;
  onUpdated: (m: MediaRow) => void;
  onDeleted: () => void;
}) {
  const { notify, confirm } = useFeedback();
  const [alt, setAlt] = useState(media.alt);
  const [busy, setBusy] = useState(false);
  const dirty = alt.trim() !== media.alt;
  useTrackDirty(`media:${media.id}`, dirty);
  const isStatic = media.src_lg.startsWith('/');

  async function saveAlt() {
    setBusy(true);
    try {
      onUpdated(await updateMediaAlt(media.id, alt.trim()));
      notify('success', 'Descrição atualizada.');
    } catch (e) {
      notify('error', toFriendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const usage = await getMediaUsage(media.id);
      const ok = await confirm({
        title: 'Excluir imagem?',
        danger: true,
        confirmLabel: 'Excluir imagem',
        message:
          usage.length > 0 ? (
            <>
              <p>
                <strong>Esta imagem está em uso no site:</strong>
              </p>
              <ul>
                {usage.map((u) => (
                  <li key={u.label}>{u.label}</li>
                ))}
              </ul>
              <p>
                Ao excluir, essas seções ficarão sem imagem e as fotos da galeria serão removidas. Esta ação não pode
                ser desfeita.
              </p>
            </>
          ) : (
            <p>A imagem não está em uso no site. Esta ação não pode ser desfeita.</p>
          ),
      });
      if (!ok) return;
      await deleteMedia(media);
      notify('success', 'Imagem excluída.');
      onDeleted();
    } catch (e) {
      notify('error', toFriendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className={styles.card}>
      <img src={mediaThumb(media)} alt="" loading="lazy" className={styles.thumb} />
      <div className={styles.body}>
        <p className={styles.meta}>
          {media.width_lg}×{media.height_lg}px{isStatic ? ' · imagem original do site' : ''}
          {media.source_media_id ? ' · recorte (a original continua na biblioteca)' : ''}
        </p>
        <TextField
          id={`alt-${media.id}`}
          label="Descrição (texto alternativo)"
          maxLength={200}
          value={alt}
          onValueChange={setAlt}
        />
        <div className={styles.actions}>
          <Button variant="ghost" size="sm" icon={<Trash2 aria-hidden="true" />} onClick={remove} disabled={busy}>
            Excluir
          </Button>
          <Button size="sm" onClick={saveAlt} disabled={!dirty || busy}>
            Salvar descrição
          </Button>
        </div>
      </div>
    </li>
  );
}
