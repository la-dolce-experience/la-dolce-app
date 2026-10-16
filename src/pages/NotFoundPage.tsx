import { ButtonLink } from '../components/Button/Button';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  useDocumentMeta({ title: 'Página não encontrada | La Dolce Experience', noindex: true });
  return (
    <main className={styles.page}>
      <img src="/images/logo.webp" alt="La Dolce Experience" width={480} height={303} className={styles.logo} />
      <h1>Página não encontrada</h1>
      <p>O endereço pode ter mudado. Volte para a página inicial para conhecer a experiência.</p>
      <ButtonLink href="/">Ir para a página inicial</ButtonLink>
    </main>
  );
}
