import type { SiteContent } from '../../types/content';
import { buildStructuredData } from '../../utils/structuredData';

export function StructuredData({ content, siteUrl }: { content: SiteContent; siteUrl: string }) {
  // Escapa "<" para impedir o fechamento prematuro da tag <script>.
  const json = JSON.stringify(buildStructuredData(content, siteUrl)).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
