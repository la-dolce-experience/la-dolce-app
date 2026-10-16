import { Button } from '../../../components/Button/Button';
import a from '../admin.module.css';

interface Props {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
  /** Fixa a barra no rodapé da tela enquanto rola (padrão). */
  sticky?: boolean;
}

/** Barra fixa com o estado das alterações e o botão de salvar explícito. */
export function SaveBar({ dirty, saving, onSave, onDiscard, sticky = true }: Props) {
  return (
    <div className={`${a.saveBar} ${sticky ? '' : a.saveBarInline}`} data-tour="save-bar">
      <span className={dirty ? a.dirty : a.clean} role="status">
        {dirty ? 'Alterações não salvas' : 'Tudo salvo'}
      </span>
      <div className={a.saveBarActions}>
        {dirty && (
          <Button variant="outline" size="sm" onClick={onDiscard} disabled={saving}>
            Descartar
          </Button>
        )}
        <Button size="sm" onClick={onSave} disabled={!dirty || saving} aria-busy={saving}>
          {saving ? 'Salvando…' : 'Salvar alterações'}
        </Button>
      </div>
    </div>
  );
}
