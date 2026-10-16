/** Converte erros do Supabase/rede em mensagens compreensíveis para o cliente. */
export function toFriendlyError(error: unknown): string {
  const e = (error ?? {}) as { message?: string; code?: string; status?: number; name?: string };
  const message = e.message ?? String(error);

  if (e.name === 'TypeError' && /fetch/i.test(message)) {
    return 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.';
  }
  if (/failed to fetch|network|load failed/i.test(message)) {
    return 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.';
  }
  if (e.status === 429 || /rate limit/i.test(message)) {
    return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.';
  }
  if (/invalid login credentials/i.test(message)) return 'E-mail ou senha incorretos.';
  if (/email not confirmed/i.test(message)) return 'Este e-mail ainda não foi confirmado.';
  if (/jwt expired|invalid jwt|not authenticated|session/i.test(message)) {
    return 'Sua sessão expirou. Entre novamente para continuar.';
  }
  if (e.code === '42501' || /row-level security|permission denied/i.test(message)) {
    return 'Você não tem permissão para esta ação. Entre novamente com uma conta de administrador.';
  }
  if (e.code === '23514' || /check constraint/i.test(message)) {
    return 'Algum campo está em um formato inválido. Revise os dados e tente novamente.';
  }
  if (e.code === '23503') return 'Este item está vinculado a outro conteúdo e não pode ser alterado assim.';
  if (/payload too large|maximum allowed size|exceeded/i.test(message)) {
    return 'O arquivo é grande demais. Use uma imagem menor.';
  }
  if (/mime type|invalid_mime/i.test(message)) return 'Formato de arquivo não permitido.';
  if (/weak|password should/i.test(message)) {
    return 'Senha fraca: use ao menos 10 caracteres com letras maiúsculas, minúsculas e números.';
  }
  if (/reauthentication|recent login|reauthenticate/i.test(message)) {
    return 'Por segurança, saia e entre novamente antes de trocar a senha.';
  }
  return 'Algo deu errado. Tente novamente em instantes.';
}
