import { ExternalLink, Eye } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { Button, ButtonLink } from '../../../components/Button/Button';
import a from '../admin.module.css';
import { useLivePreview, usePreviewTarget } from '../preview/LivePreview';

interface Props {
  breadcrumb?: string;
  title: string;
  description?: ReactNode;
  /** Parte do site editada nesta tela ('' = topo): ativa a pré-visualização e o "Ver no site". */
  previewAnchor?: string;
}

export function PageHeader({ breadcrumb, title, description, previewAnchor }: Props) {
  const { open: previewOpen, show: showPreview } = useLivePreview();
  usePreviewTarget(previewAnchor);

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
        <div className={a.pageHeaderActions}>
          {!previewOpen && (
            <Button
              variant="outline"
              size="sm"
              icon={<Eye aria-hidden="true" />}
              onClick={showPreview}
              data-tour="preview-open"
            >
              Pré-visualizar
            </Button>
          )}
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
        </div>
      )}
    </header>
  );
}
