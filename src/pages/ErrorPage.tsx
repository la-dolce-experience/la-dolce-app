import { useEffect } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { Button, ButtonLink } from '../components/Button/Button';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { reportError } from '../lib/monitoring';
import { isOutdatedBuildError } from '../utils/outdatedBuild';
import { NotFoundPage } from './NotFoundPage';
import styles from './NotFoundPage.module.css';

interface Props {
  /** Painel: o botão secundário volta para a Visão geral em vez da página inicial. */
  area?: 'site' | 'admin';
}

/** Tela de erro das rotas: substitui a tela padrão do React Router, em inglês. */
export function ErrorPage({ area = 'site' }: Props) {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  const outdated = isOutdatedBuildError(error);
  useDocumentMeta({ title: 'Algo deu errado | La Dolce Experience', noindex: true });

  useEffect(() => {
    if (!notFound && !outdated) reportError(error, { area });
  }, [error, notFound, outdated, area]);

  if (notFound) return <NotFoundPage />;

  const home =
    area === 'admin'
      ? { href: '/admin', label: 'Voltar à Visão geral' }
      : { href: '/', label: 'Ir para a página inicial' };

  return (
    <main className={styles.page} role="alert">
      <img src="/images/logo.webp" alt="La Dolce Experience" width={480} height={303} className={styles.logo} />
      <h1>{outdated ? 'O site foi atualizado' : 'Algo deu errado'}</h1>
      <p>
        {outdated
          ? 'Uma nova versão foi publicada enquanto a página estava aberta. Recarregue para continuar.'
          : 'Não foi possível exibir esta página. Recarregue para tentar de novo. Se continuar, volte mais tarde.'}
      </p>
      <div className={styles.actions}>
        <Button onClick={() => window.location.reload()}>Recarregar a página</Button>
        <ButtonLink href={home.href} variant="outline">
          {home.label}
        </ButtonLink>
      </div>
    </main>
  );
}
