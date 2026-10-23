import { SECTION_ICONS } from '../sectionIcons';
import styles from './IconPicker.module.css';

interface Props {
  /** Prefixo dos ids e nome do grupo de opções. */
  id: string;
  label: string;
  help?: string;
  value: string;
  onChange: (key: string) => void;
}

/** Escolha do ícone da seção no menu lateral: um grupo de opções, cada uma mostrando o ícone. */
export function IconPicker({ id, label, help, value, onChange }: Props) {
  return (
    <fieldset className={styles.picker} aria-describedby={help ? `${id}-help` : undefined}>
      <legend>{label}</legend>
      {help && (
        <p id={`${id}-help`} className={styles.help}>
          {help}
        </p>
      )}
      <div className={styles.grid}>
        {SECTION_ICONS.map(({ key, label: name, icon: Icon }) => (
          <label key={key} className={styles.option} title={name}>
            <input
              type="radio"
              name={id}
              value={key}
              checked={value === key}
              onChange={() => onChange(key)}
              aria-label={name}
            />
            <Icon aria-hidden="true" />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
