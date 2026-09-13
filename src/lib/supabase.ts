import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables for Supabase connection
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Checks if Supabase credentials are configured in the current environment
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    !supabaseUrl.includes('your-project') &&
    supabaseAnonKey !== 'your-supabase-anon-key'
  );
}

let supabaseInstance: SupabaseClient | null = null;

/**
 * Returns the initialized Supabase client instance or creates one if configured
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        db: {
          schema: 'public',
        },
      });
    } catch (err) {
      console.warn('[Supabase] Falha ao inicializar cliente Supabase:', err);
      return null;
    }
  }

  return supabaseInstance;
}

export interface SupabaseHealthStatus {
  configured: boolean;
  connected: boolean;
  url?: string;
  error?: string;
  timestamp: string;
}

/**
 * Tests connection to the Supabase backend
 */
export async function testSupabaseConnection(): Promise<SupabaseHealthStatus> {
  const configured = isSupabaseConfigured();
  if (!configured) {
    return {
      configured: false,
      connected: false,
      timestamp: new Date().toISOString(),
      error: 'Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não configuradas.',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      configured: true,
      connected: false,
      url: supabaseUrl,
      timestamp: new Date().toISOString(),
      error: 'Instância do cliente Supabase indisponível.',
    };
  }

  try {
    // Quick query to test connection against students or health
    const { error } = await client.from('workshops').select('id').limit(1);
    
    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist yet, it's connected to Supabase but migrations are needed
      if (error.code === '42P01') {
        return {
          configured: true,
          connected: true,
          url: supabaseUrl,
          timestamp: new Date().toISOString(),
          error: 'Conectado ao Supabase! Tabelas ainda não criadas (execute as migrações SQL geradas).',
        };
      }
      return {
        configured: true,
        connected: false,
        url: supabaseUrl,
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }

    return {
      configured: true,
      connected: true,
      url: supabaseUrl,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      url: supabaseUrl,
      timestamp: new Date().toISOString(),
      error: err?.message || 'Falha na conexão com Supabase',
    };
  }
}
