/**
 * Depois de uma nova publicação, quem estava com o site aberto pode pedir um arquivo
 * que não existe mais. Recarregar resolve.
 */
export function isOutdatedBuildError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported|ChunkLoadError/i.test(
    message,
  );
}
