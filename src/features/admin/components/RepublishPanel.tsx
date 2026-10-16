import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../../components/Button/Button';
import { getLastDeployRequest, requestRepublish, type DeployRequestRow } from '../../../services/adminService';
import { toFriendlyError } from '../../../services/errors';
import a from '../admin.module.css';
import { useFeedback } from './Feedback';
import { useAnyDirty } from './UnsavedChanges';

const dateTime = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
});

/**
 * Republica o site para atualizar título, descrição e imagem que o WhatsApp e as redes sociais
 * mostram ao compartilhar o link (eles leem o HTML publicado, não o painel).
 */
export function RepublishPanel() {
  const { notify } = useFeedback();
  const dirty = useAnyDirty();
  const [last, setLast] = useState<DeployRequestRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getLastDeployRequest().then(
      (row) => active && setLast(row),
      () => {},
    );
    return () => {
      active = false;
    };
  }, []);

  async function republish() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await requestRepublish();
      if (result.status === 'ok') {
        notify('success', 'Atualização iniciada. Em cerca de 2 minutos o site publicado terá a nova prévia.');
        setLast(await getLastDeployRequest().catch(() => null));
      } else if (result.status === 'wait') {
        const minutes = Math.max(1, Math.ceil(result.retryAfterSeconds / 60));
        setMessage(
          `Uma atualização foi pedida há pouco. Aguarde ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} para pedir de novo.`,
        );
      } else if (result.status === 'not_configured') {
        setMessage('A atualização automática ainda não foi configurada. Peça ao responsável técnico.');
      } else {
        setMessage('A Vercel não aceitou o pedido agora. Tente novamente em alguns minutos.');
      }
    } catch (e) {
      notify('error', toFriendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={a.panel} aria-labelledby="republish-title" data-tour="republish">
      <div className={a.panelHeader}>
        <div>
          <h2 id="republish-title">Atualizar a prévia do link</h2>
          <p>
            WhatsApp, Facebook e Google leem a versão publicada do site. Depois de salvar um novo título, descrição ou
            imagem de compartilhamento, atualize a publicação para eles enxergarem a mudança.
          </p>
        </div>
      </div>
      <div className={a.inlineActions}>
        <Button
          icon={<RefreshCw aria-hidden="true" />}
          onClick={republish}
          disabled={busy || dirty}
          aria-busy={busy}
          aria-describedby={dirty ? 'republish-dirty' : undefined}
        >
          {busy ? 'Enviando…' : 'Atualizar prévia do link'}
        </Button>
        {last && (
          <p className={a.muted}>
            Último pedido: {dateTime.format(new Date(last.requested_at))}
            {last.ok ? '' : ' (não concluído)'}
          </p>
        )}
      </div>
      {dirty && (
        <p id="republish-dirty" className={a.muted}>
          Salve as alterações desta página antes de atualizar a prévia.
        </p>
      )}
      {message && (
        <p className={a.notice} role="status">
          {message}
        </p>
      )}
      <p className={a.muted}>
        Links já compartilhados podem continuar com a prévia antiga por alguns dias: cada aplicativo guarda a sua cópia.
      </p>
    </section>
  );
}
