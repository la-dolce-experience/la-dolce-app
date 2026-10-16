import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from './env';

export { MEDIA_BUCKET } from './env';

/**
 * Cliente do Supabase usado pelo PAINEL (carregado sob demanda). O site público
 * lê o conteúdo via fetch direto (contentService), sem baixar esta biblioteca.
 * Usa a chave pública (anon). Toda autorização é feita
 * pelas políticas RLS no banco — o frontend nunca recebe a service_role.
 * É null quando as variáveis não estão configuradas: o site público usa o
 * conteúdo padrão e o painel exibe instruções de configuração.
 */
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export function requireSupabase(): SupabaseClient<Database> {
  if (!supabase) throw new Error('Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  return supabase;
}
