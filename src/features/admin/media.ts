import type { MediaRow } from '../../services/adminService';
import { resolveMediaUrl } from '../../services/contentService';

/** URL da variante pequena, usada nas miniaturas do painel. */
export function mediaThumb(media: MediaRow) {
  return resolveMediaUrl(media.src_sm);
}
