import { useEffect, useRef, useState } from 'react';
import { Button } from '../../../components/Button/Button';
import type { SectionRow } from '../../../services/adminService';
import type { SectionType } from '../../../types/content';
import { defaultIconKey } from '../sectionIcons';
import { SECTION_TYPE_CONFIG, sectionTypeConfig } from '../sectionTypes';
import { SelectField, TextField } from './Fields';
import { IconPicker } from './IconPicker';
import styles from './AddSectionDialog.module.css';

export interface AddSectionChoice {
  type: SectionType;
  name: string;
  /** Ícone no menu lateral do painel (ver sectionIcons). */
  icon: string;
  /** Posição da nova seção (0 = topo da página). */
  position: number;
}

interface Props {
  sections: SectionRow[];
  /** Posição sugerida (ex.: o "+" entre duas seções). Padrão: fim da página. */
  initialPosition?: number;
  busy: boolean;
  onConfirm: (choice: AddSectionChoice) => void;
  onClose: () => void;
}

/** Escolha do tipo, do nome e do lugar de uma seção nova. */
export function AddSectionDialog({ sections, initialPosition, busy, onConfirm, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [type, setType] = useState<SectionType | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [position, setPosition] = useState(initialPosition ?? sections.length);
  const [error, setError] = useState<string>();
  const used = new Set(sections.map((s) => s.type));

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal?.();
  }, []);

  function choose(next: SectionType) {
    setType(next);
    // O nome acompanha o tipo enquanto a pessoa não digitou outro.
    const previous = type ? sectionTypeConfig[type].starter.name : '';
    if (!name.trim() || name === previous) setName(sectionTypeConfig[next].starter.name);
    // O ícone também, enquanto a pessoa não escolheu outro.
    if (!icon || (type && icon === defaultIconKey(type))) setIcon(defaultIconKey(next));
    setError(undefined);
  }

  function submit() {
    if (!type) {
      setError('Escolha o tipo da seção.');
      return;
    }
    if (!name.trim()) {
      setError('Dê um nome para a seção.');
      return;
    }
    onConfirm({ type, name: name.trim(), icon: icon || defaultIconKey(type), position });
  }

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="add-section-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <form
        method="dialog"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <h2 id="add-section-title">Adicionar seção</h2>

        <fieldset className={styles.types}>
          <legend>Tipo de seção</legend>
          {SECTION_TYPE_CONFIG.map((c) => {
            const taken = c.single && used.has(c.type);
            const Icon = c.icon;
            return (
              <label key={c.type} className={`${styles.type} ${taken ? styles.typeDisabled : ''}`}>
                <input
                  type="radio"
                  name="section-type"
                  value={c.type}
                  checked={type === c.type}
                  disabled={taken}
                  onChange={() => choose(c.type)}
                />
                <Icon aria-hidden="true" />
                <span>
                  <strong>{c.label}</strong>
                  <small>{taken ? 'Já existe na página (só pode haver uma).' : c.description}</small>
                </span>
              </label>
            );
          })}
        </fieldset>

        <div className={styles.row}>
          <TextField
            id="add-section-name"
            label="Nome da seção no painel"
            help="Só você vê. Depois dá para mudar o nome e o item do menu do site."
            maxLength={60}
            value={name}
            onValueChange={(v) => {
              setName(v);
              setError(undefined);
            }}
          />
          <SelectField
            id="add-section-position"
            label="Onde a seção entra na página"
            value={String(position)}
            onValueChange={(v) => setPosition(Number(v))}
            options={[
              { value: '0', label: 'No topo da página' },
              ...sections.map((s, i) => ({ value: String(i + 1), label: `Depois de “${s.name}”` })),
            ]}
          />
        </div>

        <IconPicker
          id="add-section-icon"
          label="Ícone no menu do painel"
          help={
            type ? 'Aparece ao lado do nome no menu lateral.' : 'Escolha o tipo da seção para ver o ícone sugerido.'
          }
          value={icon}
          onChange={setIcon}
        />

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy} aria-busy={busy}>
            {busy ? 'Criando…' : 'Criar seção'}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
