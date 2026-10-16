import { ArrowDown, ArrowUp, LoaderCircle, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../../components/Button/Button';
import {
  deleteItem,
  insertItem,
  listItems,
  listMedia,
  reorderItems,
  updateItem,
  type ListRow,
  type ListTable,
  type MediaRow,
} from '../../../services/adminService';
import { toFriendlyError } from '../../../services/errors';
import type { TablesInsert } from '../../../types/database';
import a from '../admin.module.css';
import { useFeedback } from './Feedback';
import { TextAreaField, TextField, ToggleField } from './Fields';
import { ImagePicker } from './ImagePicker';
import { useTrackDirty } from './UnsavedChanges';
import styles from './ListEditor.module.css';

type Values = Record<string, string | boolean | null>;

export interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'checkbox' | 'media';
  required?: boolean;
  maxLength?: number;
  rows?: number;
  help?: string;
}

interface Props<T extends ListTable> {
  table: T;
  title: string;
  description?: string;
  /** Nome de um item no singular, ex.: "pergunta". */
  itemName: string;
  fields: FieldDef[];
  /** Campo usado como título do cartão. */
  titleField: string;
  defaults: Values;
  emptyText: string;
}

interface Item {
  /** Chave local estável (id do banco ou temporária para rascunhos). */
  key: string;
  id: string | null;
  /** Posição gravada no banco (null em rascunhos). */
  position: number | null;
  values: Values;
}

const pick = (row: Record<string, unknown>, fields: FieldDef[]): Values =>
  Object.fromEntries(
    fields.map((f) => [f.key, (row[f.key] as Values[string]) ?? (f.type === 'checkbox' ? false : '')]),
  );

export function ListEditor<T extends ListTable>({
  table,
  title,
  description,
  itemName,
  fields,
  titleField,
  defaults,
  emptyText,
}: Props<T>) {
  const { notify } = useFeedback();
  const [items, setItems] = useState<Item[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [media, setMedia] = useState<Map<string, MediaRow>>(new Map());
  const [reordering, setReordering] = useState(false);
  const hasMedia = fields.some((f) => f.type === 'media');

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([listItems(table), hasMedia ? listMedia() : Promise.resolve([])]).then(
      ([rows, mediaRows]) => {
        if (!active) return;
        setMedia(new Map(mediaRows.map((m) => [m.id, m])));
        setItems(
          (rows as unknown as Record<string, unknown>[]).map((r) => ({
            key: r.id as string,
            id: r.id as string,
            position: r.position as number,
            values: pick(r, fields),
          })),
        );
      },
      (e: unknown) => active && setLoadError(toFriendlyError(e)),
    );
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, attempt]);

  const [highlighted, setHighlighted] = useState<string | null>(null);

  /** Novos itens entram no fim, como no site: a tela rola até o rascunho e o primeiro campo recebe o foco. */
  function addDraft() {
    const key = `novo-${crypto.randomUUID()}`;
    setItems((list) => [
      ...(list ?? []),
      { key, id: null, position: null, values: { ...pick({}, fields), ...defaults } },
    ]);
    setHighlighted(key);
    requestAnimationFrame(() => {
      const card = document.getElementById(`item-${key}`);
      if (!card) return;
      card.scrollIntoView({ block: 'start' });
      card
        .querySelector<HTMLElement>('input[type="text"], input:not([type]), textarea')
        ?.focus({ preventScroll: true });
    });
  }

  async function move(index: number, delta: -1 | 1) {
    if (!items) return;
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const previous = items;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    setReordering(true);
    try {
      const savedIds = next.filter((i) => i.id).map((i) => i.id!);
      await reorderItems(table, savedIds);
      setItems((list) => list!.map((i) => (i.id ? { ...i, position: savedIds.indexOf(i.id) } : i)));
      notify('success', 'Ordem atualizada.');
      requestAnimationFrame(() =>
        document
          .getElementById(`item-${next[target].key}`)
          ?.querySelector<HTMLElement>(`[data-move="${delta}"]`)
          ?.focus(),
      );
    } catch (e) {
      setItems(previous);
      notify('error', toFriendlyError(e));
    } finally {
      setReordering(false);
    }
  }

  // Depois do maior valor gravado: exclusões deixam lacunas, então contar os itens poderia repetir uma posição.
  const nextPosition = useMemo(
    () => (items ?? []).reduce((max, i) => (i.position === null ? max : Math.max(max, i.position + 1)), 0),
    [items],
  );

  const addButton = (
    <Button size="sm" icon={<Plus aria-hidden="true" />} onClick={addDraft} disabled={!items} data-tour="list-add">
      Adicionar {itemName}
    </Button>
  );

  return (
    <section className={a.panel} aria-labelledby={`${table}-title`}>
      <div className={a.panelHeader}>
        <div>
          <h2 id={`${table}-title`}>{title}</h2>
          {description && <p>{description}</p>}
          <p className={styles.hint}>Itens novos entram no fim da lista, na mesma ordem em que aparecem no site.</p>
        </div>
        {addButton}
      </div>

      {loadError && (
        <div className={`${a.notice} ${a.noticeError}`} role="alert">
          <p>{loadError}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setLoadError(null);
              setAttempt((n) => n + 1);
            }}
          >
            Tentar novamente
          </Button>
        </div>
      )}
      {!items && !loadError && (
        <p className={a.loading} role="status">
          <LoaderCircle className={a.spin} aria-hidden="true" /> Carregando…
        </p>
      )}
      {items && items.length === 0 && <p className={a.empty}>{emptyText}</p>}

      {items && items.length > 0 && (
        <ol className={styles.list}>
          {items.map((item, index) => (
            <ItemCard
              key={item.key}
              item={item}
              highlighted={item.key === highlighted}
              index={index}
              total={items.length}
              table={table}
              fields={fields}
              titleField={titleField}
              itemName={itemName}
              media={media}
              position={nextPosition}
              reordering={reordering}
              onMove={(delta) => move(index, delta)}
              onMediaAdded={(m) => setMedia((prev) => new Map(prev).set(m.id, m))}
              onSaved={(saved) =>
                setItems((list) =>
                  list!.map((i) =>
                    i.key === item.key ? { ...i, id: saved.id, position: saved.position, values: saved.values } : i,
                  ),
                )
              }
              onRemoved={() => setItems((list) => list!.filter((i) => i.key !== item.key))}
            />
          ))}
        </ol>
      )}
      {items && items.length > 0 && <div className={styles.footer}>{addButton}</div>}
    </section>
  );
}

interface CardProps {
  item: Item;
  highlighted: boolean;
  index: number;
  total: number;
  table: ListTable;
  fields: FieldDef[];
  titleField: string;
  itemName: string;
  media: Map<string, MediaRow>;
  position: number;
  reordering: boolean;
  onMove: (delta: -1 | 1) => void;
  onMediaAdded: (m: MediaRow) => void;
  onSaved: (saved: { id: string; position: number; values: Values }) => void;
  onRemoved: () => void;
}

function ItemCard({
  item,
  highlighted,
  index,
  total,
  table,
  fields,
  titleField,
  itemName,
  media,
  position,
  reordering,
  onMove,
  onMediaAdded,
  onSaved,
  onRemoved,
}: CardProps) {
  const { notify, confirm } = useFeedback();
  const [values, setValues] = useState<Values>(item.values);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const isDraft = item.id === null;
  const dirty = isDraft || JSON.stringify(values) !== JSON.stringify(item.values);
  useTrackDirty(`${table}:${item.key}`, dirty);

  const heading = String(values[titleField] || '').trim() || `Novo(a) ${itemName}`;
  const fid = (key: string) => `${item.key}-${key}`;

  function set(key: string, value: Values[string]) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors(({ [key]: _removed, ...rest }) => rest);
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    for (const f of fields) {
      const v = values[f.key];
      if (f.required && (v === null || v === '' || (typeof v === 'string' && !v.trim()))) {
        next[f.key] = f.type === 'media' ? 'Escolha uma imagem.' : 'Preencha este campo.';
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setBusy(true);
    const payload = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]),
    );
    try {
      const row = isDraft
        ? await insertItem(table, { ...payload, position } as TablesInsert<typeof table>)
        : await updateItem(table, item.id!, payload);
      const saved = pick(row as unknown as Record<string, unknown>, fields);
      setValues(saved);
      const { id, position: savedPosition } = row as { id: string; position: number };
      onSaved({ id, position: savedPosition, values: saved });
      notify('success', isDraft ? `${capitalize(itemName)} adicionado(a).` : 'Alterações salvas.');
    } catch (e) {
      notify('error', toFriendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (isDraft) {
      onRemoved();
      return;
    }
    const ok = await confirm({
      title: `Excluir ${itemName}?`,
      message: <p>“{heading}” será removido(a) do site. Esta ação não pode ser desfeita.</p>,
      confirmLabel: 'Excluir',
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await deleteItem(table, item.id!);
      notify('success', `${capitalize(itemName)} excluído(a).`);
      onRemoved();
    } catch (e) {
      notify('error', toFriendlyError(e));
      setBusy(false);
    }
  }

  return (
    <li
      id={`item-${item.key}`}
      data-tour="list-item"
      className={`${styles.card} ${highlighted && isDraft ? styles.cardNew : ''}`}
    >
      <div className={styles.cardHeader}>
        <h3>
          <span className={styles.index}>{index + 1}</span>
          {heading}
        </h3>
        <div className={styles.cardTools}>
          {!isDraft && values.visible === false && <span className={`${a.badge} ${a.badgeOff}`}>Oculto</span>}
          {dirty && !isDraft && <span className={a.dirty}>Não salvo</span>}
          {isDraft && <span className={a.dirty}>Rascunho</span>}
          <button
            type="button"
            className={styles.iconBtn}
            data-move={-1}
            onClick={() => onMove(-1)}
            disabled={index === 0 || isDraft || reordering || dirty}
            aria-label={`Mover “${heading}” para cima`}
          >
            <ArrowUp aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            data-move={1}
            onClick={() => onMove(1)}
            disabled={index === total - 1 || isDraft || reordering || dirty}
            aria-label={`Mover “${heading}” para baixo`}
          >
            <ArrowDown aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className={styles.fields}>
        {fields.map((f) => {
          const value = values[f.key];
          if (f.type === 'checkbox') {
            return (
              <ToggleField
                key={f.key}
                id={fid(f.key)}
                label={f.label}
                help={f.help}
                checked={value === true}
                onChange={(v) => set(f.key, v)}
              />
            );
          }
          if (f.type === 'media') {
            return (
              <div key={f.key}>
                <ImagePicker
                  label={f.label}
                  help={f.help}
                  media={typeof value === 'string' ? (media.get(value) ?? null) : null}
                  onChange={(m) => {
                    if (m) {
                      onMediaAdded(m);
                      // Sugere o texto alternativo da imagem escolhida se o campo estiver vazio.
                      if ('alt' in values && !String(values.alt ?? '').trim()) set('alt', m.alt);
                    }
                    set(f.key, m?.id ?? null);
                  }}
                />
                {errors[f.key] && <p className={styles.error}>{errors[f.key]}</p>}
              </div>
            );
          }
          const common = {
            id: fid(f.key),
            label: f.label,
            help: f.help,
            required: f.required,
            maxLength: f.maxLength,
            error: errors[f.key],
            value: String(value ?? ''),
            onValueChange: (v: string) => set(f.key, v),
          };
          return f.type === 'textarea' ? (
            <TextAreaField key={f.key} {...common} rows={f.rows ?? 3} />
          ) : (
            <TextField key={f.key} {...common} />
          );
        })}
      </div>

      <div className={styles.cardActions}>
        <Button variant="ghost" size="sm" icon={<Trash2 aria-hidden="true" />} onClick={remove} disabled={busy}>
          {isDraft ? 'Descartar' : 'Excluir'}
        </Button>
        {dirty && !isDraft && (
          <Button variant="outline" size="sm" onClick={() => setValues(item.values)} disabled={busy}>
            Desfazer alterações
          </Button>
        )}
        <Button size="sm" onClick={save} disabled={busy || !dirty} aria-busy={busy}>
          {busy ? 'Salvando…' : isDraft ? `Salvar ${itemName}` : 'Salvar'}
        </Button>
      </div>
    </li>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export type { ListRow };
