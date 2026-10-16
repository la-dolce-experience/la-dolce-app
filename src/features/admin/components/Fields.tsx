import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import styles from './Fields.module.css';

interface BaseProps {
  id: string;
  label: string;
  help?: ReactNode;
  error?: string;
}

function describedBy(id: string, help?: ReactNode, error?: string) {
  return [error && `${id}-error`, help && `${id}-help`].filter(Boolean).join(' ') || undefined;
}

function Meta({ id, help, error, count }: { id: string; help?: ReactNode; error?: string; count?: string }) {
  return (
    <>
      {(help || count) && (
        <div className={styles.metaRow}>
          {help && (
            <p id={`${id}-help`} className={styles.help}>
              {help}
            </p>
          )}
          {count && <span className={styles.count}>{count}</span>}
        </div>
      )}
      {error && (
        <p id={`${id}-error`} className={styles.error}>
          {error}
        </p>
      )}
    </>
  );
}

type TextFieldProps = BaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'onChange' | 'value'> & {
    value: string;
    onValueChange: (value: string) => void;
  };

export function TextField({
  id,
  label,
  help,
  error,
  value,
  onValueChange,
  maxLength,
  required,
  ...rest
}: TextFieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>
        {label}
        {required && <span className={styles.req}> (obrigatório)</span>}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        maxLength={maxLength}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, help, error)}
        {...rest}
      />
      <Meta id={id} help={help} error={error} count={maxLength ? `${value.length}/${maxLength}` : undefined} />
    </div>
  );
}

type TextAreaProps = BaseProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'onChange' | 'value'> & {
    value: string;
    onValueChange: (value: string) => void;
  };

export function TextAreaField({
  id,
  label,
  help,
  error,
  value,
  onValueChange,
  maxLength,
  required,
  rows = 4,
  ...rest
}: TextAreaProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>
        {label}
        {required && <span className={styles.req}> (obrigatório)</span>}
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        maxLength={maxLength}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, help, error)}
        {...rest}
      />
      <Meta id={id} help={help} error={error} count={maxLength ? `${value.length}/${maxLength}` : undefined} />
    </div>
  );
}

export function ToggleField({
  id,
  label,
  help,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  help?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className={styles.toggle}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-describedby={help ? `${id}-help` : undefined}
      />
      <div>
        <label htmlFor={id}>{label}</label>
        {help && (
          <p id={`${id}-help`} className={styles.help}>
            {help}
          </p>
        )}
      </div>
    </div>
  );
}
