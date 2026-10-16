/** Abre um link externo em nova aba/app, sem dar à página aberta acesso a esta. */
export function openExternal(url: string) {
  const win = window.open(url, '_blank');
  if (win) win.opener = null;
}
