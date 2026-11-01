import { CircleCheck, Crop } from 'lucide-react';
import type { MediaRow } from '../../../services/adminService';
import { describeRatio, heroCrop, heroFormat } from '../../site/heroImage';
import { mediaThumb } from '../media';
import styles from './Media.module.css';

interface Props {
  media: MediaRow;
  format: unknown;
  caption: string;
}

/**
 * Como a foto do topo aparece no site (a moldura tem a mesma proporção no celular e no computador) e quanto
 * dela é cortado. Ajuda a escolher o formato e o ponto de foco sem precisar abrir o site.
 */
export function HeroImagePreview({ media, format, caption }: Props) {
  const f = heroFormat(format);
  const crop = heroCrop(media.width_lg, media.height_lg, f);
  const percent = Math.round(crop.hidden * 100);

  return (
    <div className={styles.heroPreview} data-testid="hero-preview">
      <p className={styles.pickerLabel}>Como a foto aparece no site (celular e computador)</p>
      <div className={styles.heroPreviewFrame} style={{ aspectRatio: String(f.ratio) }}>
        <img src={mediaThumb(media)} alt="" />
        {caption.trim() && <span className={styles.heroPreviewBadge}>{caption}</span>}
      </div>
      <p className={styles.heroPreviewInfo} role="status">
        {crop.side ? <Crop aria-hidden="true" /> : <CircleCheck aria-hidden="true" />}
        <span>
          Sua foto: {media.width_lg} × {media.height_lg} px ({describeRatio(media.width_lg, media.height_lg)}).{' '}
          {crop.side
            ? `No formato ${f.label.toLowerCase()}, cerca de ${percent}% da foto fica de fora (${crop.side}). Use "Ajustar recorte" para escolher o que aparece, envie uma foto de ${f.ideal} ou troque o formato.`
            : `Está na proporção certa para o formato ${f.label.toLowerCase()}: aparece inteira.`}
        </span>
      </p>
    </div>
  );
}
