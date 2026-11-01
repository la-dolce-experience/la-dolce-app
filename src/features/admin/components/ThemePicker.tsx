import { CircleAlert, CircleCheck } from 'lucide-react';
import { useId } from 'react';
import { customTheme, formatRatio, SECTION_THEMES } from '../../site/sectionThemes';
import { themeColorError } from '../themeColor';
import styles from './ThemePicker.module.css';

interface Props {
  id: string;
  theme: string;
  color: string;
  onChange: (theme: string, color: string) => void;
}

const DEFAULT_CUSTOM = '#1d4ed8';

/**
 * Cor de fundo da seção: amostras clicáveis da paleta (com o texto como fica no site) e cor personalizada
 * (seletor + campo hexadecimal), com o texto claro ou escuro escolhido sozinho pelo contraste.
 */
export function ThemePicker({ id, theme, color, onChange }: Props) {
  const hexId = useId();
  const statusId = useId();
  const custom = customTheme(color);
  const error = themeColorError(theme, color);
  const current = SECTION_THEMES.some((t) => t.value === theme) ? theme : 'padrao';

  return (
    <fieldset className={styles.picker} id={id}>
      <legend>Cor de fundo da seção</legend>
      <p className={styles.help}>
        A cor ocupa a faixa inteira, de ponta a ponta da tela. Os textos ficam claros ou escuros conforme o fundo, para
        continuar fáceis de ler.
      </p>
      <div className={styles.swatches}>
        {SECTION_THEMES.map((t) => {
          const isCustom = t.value === 'personalizada';
          const background = isCustom ? (custom?.background ?? DEFAULT_CUSTOM) : t.swatch;
          const text = isCustom ? (custom?.text ?? '#ffffff') : t.text;
          return (
            <label key={t.value} className={styles.swatch}>
              <input
                type="radio"
                name={`${id}-tema`}
                value={t.value}
                checked={current === t.value}
                onChange={() => onChange(t.value, isCustom ? color || DEFAULT_CUSTOM : color)}
              />
              <span className={styles.sample} style={{ background, color: text }} aria-hidden="true">
                Aa
              </span>
              <span className={styles.name}>{t.label}</span>
            </label>
          );
        })}
      </div>

      {current === 'personalizada' && (
        <div className={styles.custom}>
          <label className={styles.colorLabel}>
            <span>Escolher no seletor</span>
            <input
              type="color"
              value={custom?.background ?? DEFAULT_CUSTOM}
              onChange={(e) => onChange('personalizada', e.target.value)}
            />
          </label>
          <div className={styles.hex}>
            <label htmlFor={hexId}>Código da cor</label>
            <input
              id={hexId}
              type="text"
              inputMode="text"
              maxLength={7}
              spellCheck={false}
              autoComplete="off"
              value={color}
              placeholder="#4B1E4F"
              aria-invalid={error ? true : undefined}
              aria-describedby={statusId}
              onChange={(e) => {
                const raw = e.target.value.trim();
                onChange('personalizada', raw && !raw.startsWith('#') ? `#${raw}` : raw);
              }}
            />
          </div>
          <p id={statusId} className={error ? styles.error : styles.ok} role={error ? 'alert' : 'status'}>
            {error ? <CircleAlert aria-hidden="true" /> : <CircleCheck aria-hidden="true" />}
            <span>
              {error ??
                `Texto ${custom?.text === '#ffffff' ? 'branco' : 'escuro'} sobre esta cor: contraste ${formatRatio(custom?.ratio ?? 0)} (mínimo 4,5:1).`}
            </span>
          </p>
        </div>
      )}
    </fieldset>
  );
}
