import { createClient } from '@supabase/supabase-js';

// Mock Supabase client for design prototype
// TODO: Replace with actual Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Mock auth state for prototype
export const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'usuario@exemplo.com',
  nome: 'João Silva',
  assinante_id: '123e4567-e89b-12d3-a456-426614174001',
};

// Mock RPC responses for prototype
export const mockRpcResponses = {
  processar_pos_login: {
    status: 'OK',
    usuario: {
      id: mockUser.id,
      nome: 'João Silva',
      nome_exibicao: 'João',
      whatsapp: '11987654321',
      ver_boas_vindas: true,
    },
    funcoes: ['ADMIN', 'PROFISSIONAL'],
    assinante: {
      id: mockUser.assinante_id,
      nome: 'Empresa Exemplo LTDA',
      nome_fantasia: 'Empresa Exemplo',
    },
    assinatura: {
      id: '123e4567-e89b-12d3-a456-426614174002',
      status: 'ATIVA',
      periodicidade: 'MENSAL',
      data_inicio: '2024-01-01',
      data_validade: '2025-01-01',
      plano: {
        id: 1,
        titulo: 'Plano Gratuito',
        ind_gratuito: true,
      },
    },
  },
};
