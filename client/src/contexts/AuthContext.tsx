import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { callSupabase, ApiError } from '@/lib/api-helper';
import { queryClient } from '@/lib/queryClient';
import type { UserRole } from '@/types/roles';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  assinanteId: string | null;
  roles: UserRole[];
  isAdmin: boolean;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [assinanteId, setAssinanteId] = useState<string | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar assinante_id e roles quando o usuário estiver logado
  const fetchAssinanteId = async () => {
    try {
      const dados = await callSupabase<{ id: string }>( async () =>
        await supabase.rpc('obter_dados_assinante')
      );
      
      if (dados?.id) {
        setAssinanteId(dados.id);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('❌ Erro ao buscar assinante_id:', error.code, error.message);
        
        // Se o usuário não existe, pode ser que o onboarding não foi processado corretamente
        if (error.code === 'USER_NOT_FOUND') {
          console.warn('⚠️ Usuário sem registro de assinante. Isso pode indicar que o onboarding não foi concluído corretamente.');
          // Mantém assinanteId como null - o App.tsx redirecionará para onboarding se necessário
        }
      } else {
        console.error('❌ Erro ao buscar assinante_id:', error);
      }
    }
  };

  const fetchUserRoles = async (userId: string) => {
    try {
      // NOTA: A RPC 'obter_funcoes_usuario' deve ser criada no backend Supabase
      // Enquanto isso, usar implementação alternativa:
      // Buscar roles através da tabela de metadados do usuário
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;

      // Os roles podem estar armazenados nos metadados do usuário
      // ou podemos usar uma lógica temporária
      const userMetadata = userData.user?.user_metadata;
      const userRoles: UserRole[] = [];

      // Verificar se o usuário tem roles nos metadados
      if (userMetadata?.roles) {
        userRoles.push(...userMetadata.roles);
      } else {
        // Por padrão, todos os usuários são PROFISSIONAL
        userRoles.push('PROFISSIONAL');
        
        // TODO: Implementar lógica real quando a RPC estiver disponível
        // Por enquanto, detectar admin através de email ou outro critério
        if (userMetadata?.is_admin) {
          userRoles.push('ADMIN');
        }
      }

      setRoles(userRoles);
    } catch (error) {
      console.error('❌ Erro ao buscar roles do usuário:', error);
      // Por padrão, dar role PROFISSIONAL
      setRoles(['PROFISSIONAL']);
    }
  };

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchAssinanteId();
        fetchUserRoles(session.user.id);
      }
      
      setLoading(false);
    });

    // Escutar mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchAssinanteId();
        fetchUserRoles(session.user.id);
      } else {
        setAssinanteId(null);
        setRoles([]);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signOut = async () => {
    try {
      // Deslogar do Supabase primeiro
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro ao deslogar do Supabase:', error);
        return { error };
      }
      
      // Só limpa o cache e estados após logout bem-sucedido
      queryClient.clear();
      
      // Resetar estados locais
      setAssinanteId(null);
      setUser(null);
      setSession(null);
      setRoles([]);
      
      // Limpar possíveis dados em localStorage relacionados ao TanStack Query
      localStorage.removeItem('REACT_QUERY_OFFLINE_CACHE');
      
      return { error: null };
    } catch (err) {
      console.error('Erro inesperado no logout:', err);
      return { error: err as AuthError };
    }
  };

  const isAdmin = roles.includes('ADMIN');

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        assinanteId,
        roles,
        isAdmin,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
