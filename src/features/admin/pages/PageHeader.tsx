import { ExternalLink } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { ButtonLink } from '../../../components/Button/Button';
import a from '../admin.module.css';

interface Props {
  breadcrumb?: string;
  title: string;
  description?: ReactNode;
  /** Âncora do site para o botão "Ver no site" ('' = topo). */
  previewAnchor?: string;
}

export function PageHeader({ breadcrumb, title, description, previewAnchor }: Props) {
  useEffect(() => {
    document.title = `${title} | Painel La Dolce`;
  }, [title]);

  return (
    <header className={a.pageHeader}>
      <div>
        {breadcrumb && <p className={a.breadcrumb}>{breadcrumb}</p>}
        <h1 tabIndex={-1} id="admin-page-title">
          {title}
        </h1>
        {description && <p>{description}</p>}
      </div>
      {previewAnchor !== undefined && (
        <ButtonLink
          variant="outline"
          size="sm"
          href={`/${previewAnchor ? `#${previewAnchor}` : ''}`}
          target="_blank"
          rel="noopener"
          icon={<ExternalLink aria-hidden="true" />}
          data-tour="view-site"
        >
          Ver no site
        </ButtonLink>
      )}
    </header>
  );
}
