/** Mesma política configurada no Supabase Auth (10+ caracteres, maiúscula, minúscula e número). */
export function validateNewPassword(password: string, confirmation: string): string | null {
  if (password.length < 10) return 'A senha precisa ter ao menos 10 caracteres.';
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return 'Use letras maiúsculas, minúsculas e números.';
  }
  if (password !== confirmation) return 'As senhas não conferem.';
  return null;
}

/** Bloqueio local após tentativas seguidas de login (complementa o limite do Supabase). */
export const LOGIN_LOCK = { maxAttempts: 5, lockMs: 60_000 } as const;

export function nextLockState(failures: number, now: number) {
  const nextFailures = failures + 1;
  return nextFailures >= LOGIN_LOCK.maxAttempts
    ? { failures: 0, lockedUntil: now + LOGIN_LOCK.lockMs }
    : { failures: nextFailures, lockedUntil: 0 };
}
