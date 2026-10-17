import { ArchiveRestore, Download, LoaderCircle, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/Button/Button';
import {
  deleteFromTrash,
  exportContent,
  listTrash,
  restoreFromTrash,
  type TrashRow,
} from '../../../services/adminService';
import { toFriendlyError } from '../../../services/errors';
import a from '../admin.module.css';
import { useFeedback } from '../components/Feedback';
import { PageHeader } from './PageHeader';
import styles from './TrashPage.module.css';

/** Nome do item e seção do painel onde ele volta a aparecer. */
const ORIGIN: Record<string, { item: string; section: string; label: string }> = {
  event_types: { item: 'Tipo de evento', section: 'events', label: 'Tipos de evento' },
  features: { item: 'Diferencial', section: 'personalization', label: 'Personalização' },
  flavor_items: { item: 'Sabor ou apresentação', section: 'flavors', label: 'Sabores e apresentação' },
  steps: { item: 'Etapa', section: 'steps', label: 'Como funciona' },
  gallery_items: { item: 'Foto da galeria', section: 'gallery', label: 'Galeria' },
  faqs: { item: 'Pergunta frequente', section: 'faq', label: 'Perguntas frequentes' },
  testimonials: { item: 'Depoimento', section: 'testimonials', label: 'Depoimentos' },
};

const KEEP_DAYS = 30;
const dateTime = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
});

function daysLeft(deletedAt: string, now = Date.now()) {
  return Math.max(0, Math.ceil(KEEP_DAYS - (now - new Date(deletedAt).getTime()) / 864e5));
}

function download(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function TrashPage() {
  const { notify, confirm } = useFeedback();
  const [items, setItems] = useState<TrashRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    listTrash().then(
      (rows) => active && setItems(rows),
      (e: unknown) => active && setError(toFriendlyError(e)),
    );
    return () => {
      active = false;
    };
  }, [attempt]);

  async function restore(item: TrashRow) {
    setBusyId(item.id);
    try {
      await restoreFromTrash(item.id);
      setItems((list) => list!.filter((i) => i.id !== item.id));
      notify('success', `“${item.label}” foi restaurado em ${ORIGIN[item.table_name]?.label ?? 'sua lista'}.`);
    } catch (e) {
      const code = (e as { code?: string }).code;
      notify(
        'error',
        code === '23503'
          ? 'Não foi possível restaurar: a imagem usada por este item foi excluída da biblioteca.'
          : toFriendlyError(e),
      );
    } finally {
      setBusyId(null);
    }
  }

  async function remove(item: TrashRow) {
    const ok = await confirm({
      title: 'Excluir definitivamente?',
      message: <p>“{item.label}” será apagado de vez e não poderá mais ser restaurado.</p>,
      confirmLabel: 'Excluir definitivamente',
      danger: true,
    });
    if (!ok) return;
    setBusyId(item.id);
    try {
      await deleteFromTrash(item.id);
      setItems((list) => list!.filter((i) => i.id !== item.id));
      notify('success', 'Item excluído definitivamente.');
    } catch (e) {
      notify('error', toFriendlyError(e));
    } finally {
      setBusyId(null);
    }
  }

  async function backup() {
    setExporting(true);
    try {
      const data = await exportContent();
      const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
      download(`la-dolce-conteudo-${day}.json`, JSON.stringify(data, null, 2));
      notify('success', 'Cópia baixada. Guarde o arquivo em um lugar seguro.');
    } catch (e) {
      notify('error', toFriendlyError(e));
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <PageHeader
        breadcrumb="Configurações"
        title="Lixeira e cópia de segurança"
        description="Recupere itens excluídos por engano e guarde uma cópia do conteúdo do site."
      />

      <section className={a.panel} aria-labelledby="trash-title" data-tour="trash">
        <div className={a.panelHeader}>
          <div>
            <h2 id="trash-title">Lixeira</h2>
            <p>
              Itens excluídos das listas (tipos de evento, galeria, perguntas…) ficam aqui por {KEEP_DAYS} dias e depois
              são apagados de vez.
            </p>
          </div>
        </div>

        {error && (
          <div className={`${a.notice} ${a.noticeError}`} role="alert">
            <p>{error}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setError(null);
                setAttempt((n) => n + 1);
              }}
            >
              Tentar novamente
            </Button>
          </div>
        )}
        {!items && !error && (
          <p className={a.loading} role="status">
            <LoaderCircle className={a.spin} aria-hidden="true" /> Carregando…
          </p>
        )}
        {items && items.length === 0 && <p className={a.empty}>A lixeira está vazia.</p>}

        {items && items.length > 0 && (
          <ul className={styles.list}>
            {items.map((item) => {
              const origin = ORIGIN[item.table_name];
              const left = daysLeft(item.deleted_at);
              return (
                <li key={item.id} className={styles.item}>
                  <div>
                    <p className={styles.kind}>{origin?.item ?? item.table_name}</p>
                    <p className={styles.label}>{item.label || '(sem título)'}</p>
                    <p className={a.muted}>
                      Excluído em {dateTime.format(new Date(item.deleted_at))} ·{' '}
                      {left <= 1 ? 'some amanhã' : `some em ${left} dias`}
                      {origin && (
                        <>
                          {' · '}
                          <Link to={`/admin/secoes/${origin.section}`}>{origin.label}</Link>
                        </>
                      )}
                    </p>
                  </div>
                  <div className={styles.actions}>
                    <Button
                      size="sm"
                      icon={<ArchiveRestore aria-hidden="true" />}
                      onClick={() => restore(item)}
                      disabled={busyId === item.id}
                      aria-label={`Restaurar “${item.label}”`}
                    >
                      Restaurar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Trash2 aria-hidden="true" />}
                      onClick={() => remove(item)}
                      disabled={busyId === item.id}
                      aria-label={`Excluir definitivamente “${item.label}”`}
                    >
                      Excluir de vez
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={a.panel} aria-labelledby="backup-title" data-tour="backup">
        <div className={a.panelHeader}>
          <div>
            <h2 id="backup-title">Cópia de segurança</h2>
            <p>
              Baixa um arquivo com todos os textos, contatos, listas e referências das imagens. Recomendado antes de
              grandes mudanças e uma vez por mês.
            </p>
          </div>
        </div>
        <div className={a.inlineActions}>
          <Button icon={<Download aria-hidden="true" />} onClick={backup} disabled={exporting} aria-busy={exporting}>
            {exporting ? 'Preparando…' : 'Baixar cópia do conteúdo'}
          </Button>
        </div>
        <p className={a.muted}>
          O arquivo não inclui senhas nem dados de visitantes. As fotos continuam guardadas no servidor. Para voltar o
          site a uma cópia, fale com o suporte técnico.
        </p>
      </section>
    </>
  );
}
