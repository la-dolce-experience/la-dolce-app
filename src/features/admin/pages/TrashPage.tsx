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
import { notifyPublishedChange } from '../../../lib/preview';
import a from '../admin.module.css';
import { useFeedback } from '../components/Feedback';
import { useSections } from '../SectionsContext';
import { PageHeader } from './PageHeader';
import styles from './TrashPage.module.css';

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

const sectionIdOf = (item: TrashRow) => String((item.row_data as Record<string, unknown>).section_id ?? '');
const rowIdOf = (item: TrashRow) => String((item.row_data as Record<string, unknown>).id ?? '');

export function TrashPage() {
  const { notify, confirm } = useFeedback();
  const { sections, reload: reloadSections } = useSections();
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
      // Uma seção volta com os itens que foram excluídos junto com ela.
      const restored = item.table_name === 'sections' ? rowIdOf(item) : null;
      setItems((list) => list!.filter((i) => i.id !== item.id && (!restored || sectionIdOf(i) !== restored)));
      if (item.table_name === 'sections') reloadSections();
      notifyPublishedChange();
      notify(
        'success',
        item.table_name === 'sections'
          ? `A seção “${item.label}” voltou para a página, na posição em que estava.`
          : `“${item.label}” foi restaurado.`,
      );
    } catch (e) {
      const { code, hint } = e as { code?: string; hint?: string };
      notify(
        'error',
        hint === 'secao_excluida'
          ? 'A seção deste item foi excluída. Restaure primeiro a seção: os itens voltam junto.'
          : code === '23505'
            ? 'Já existe uma seção com o mesmo endereço ou do mesmo tipo único. Exclua ou renomeie a atual antes.'
            : code === '23503'
              ? 'Não foi possível restaurar: a imagem usada por este item foi excluída da biblioteca.'
              : toFriendlyError(e),
      );
    } finally {
      setBusyId(null);
    }
  }

  // Itens de uma seção que também está na lixeira aparecem dentro dela (voltam juntos).
  const trashedSections = new Set((items ?? []).filter((i) => i.table_name === 'sections').map(rowIdOf));
  const visible = items?.filter((i) => i.table_name === 'sections' || !trashedSections.has(sectionIdOf(i)));

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
      // Os itens de uma seção vão embora junto com ela.
      const removed = [
        item,
        ...(item.table_name === 'sections' ? (items ?? []).filter((i) => sectionIdOf(i) === rowIdOf(item)) : []),
      ].map((i) => i.id);
      for (const id of removed) await deleteFromTrash(id);
      setItems((list) => list!.filter((i) => !removed.includes(i.id)));
      notify('success', 'Excluído definitivamente.');
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
              Seções e itens excluídos (cartões, fotos, perguntas…) ficam aqui por {KEEP_DAYS} dias e depois são
              apagados de vez. Uma seção restaurada volta com os itens que tinha.
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
        {visible && visible.length === 0 && <p className={a.empty}>A lixeira está vazia.</p>}

        {visible && visible.length > 0 && (
          <ul className={styles.list}>
            {visible.map((item) => {
              const isSection = item.table_name === 'sections';
              const parent = isSection ? undefined : sections?.find((s) => s.id === sectionIdOf(item));
              const children = isSection ? (items ?? []).filter((i) => sectionIdOf(i) === rowIdOf(item)).length : 0;
              const left = daysLeft(item.deleted_at);
              return (
                <li key={item.id} className={styles.item}>
                  <div>
                    <p className={styles.kind}>
                      {isSection
                        ? `Seção${children ? ` · com ${children} ${children === 1 ? 'item' : 'itens'}` : ''}`
                        : 'Item de seção'}
                    </p>
                    <p className={styles.label}>{item.label || '(sem título)'}</p>
                    <p className={a.muted}>
                      Excluído em {dateTime.format(new Date(item.deleted_at))} ·{' '}
                      {left <= 1 ? 'some amanhã' : `some em ${left} dias`}
                      {parent && (
                        <>
                          {' · '}
                          <Link to={`/admin/secoes/${parent.id}`}>{parent.name}</Link>
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
