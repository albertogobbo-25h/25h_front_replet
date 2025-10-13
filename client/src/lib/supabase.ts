import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Credenciais do Supabase não configuradas. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nos Secrets.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
