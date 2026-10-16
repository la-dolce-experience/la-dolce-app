/** Configuração pública do Supabase (pode ir para o navegador; a segurança está nas políticas RLS). */
export const SUPABASE_URL = ((import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '').replace(/\/$/, '');
export const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const MEDIA_BUCKET = 'media';

/**
 * Contato do suporte técnico, exibido em "Ajuda" no painel. Opcional: sem estes
 * valores, o menu Ajuda mostra só a opção de rever o guia.
 */
export const SUPPORT_NAME = ((import.meta.env.VITE_SUPPORT_NAME as string | undefined) ?? '').trim();
export const SUPPORT_WHATSAPP = ((import.meta.env.VITE_SUPPORT_WHATSAPP as string | undefined) ?? '').replace(
  /\D/g,
  '',
);
export const SUPPORT_EMAIL = ((import.meta.env.VITE_SUPPORT_EMAIL as string | undefined) ?? '').trim();
