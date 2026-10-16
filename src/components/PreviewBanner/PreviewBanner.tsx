import { Eye, X } from 'lucide-react';
import styles from './PreviewBanner.module.css';

/** Faixa fixa no topo da pré-visualização: deixa claro que nada foi publicado ainda. */
export function PreviewBanner() {
  return (
    <div className={styles.banner} role="status">
      <Eye aria-hidden="true" />
      <p>
        <strong>Pré-visualização.</strong> Estas alterações ainda não foram salvas e só aparecem para você.
      </p>
      <button type="button" onClick={() => window.close()} aria-label="Fechar pré-visualização">
        <X aria-hidden="true" />
      </button>
    </div>
  );
}
