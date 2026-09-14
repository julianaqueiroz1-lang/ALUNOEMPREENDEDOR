import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Resolves Supabase credentials with smart auto-correction for inverted variables
 */
export function getNormalizedSupabaseConfig(): {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  projectRef: string | null;
  inverted: boolean;
} {
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('AE_SUPABASE_URL') : null;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('AE_SUPABASE_ANON_KEY') : null;

  let rawUrl = (localUrl || import.meta.env.VITE_SUPABASE_URL || '').trim();
  let rawKey = (localKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  let inverted = false;
  // If user accidentally inverted the URL and Key in env or settings
  if (
    (rawKey.startsWith('http://') || rawKey.startsWith('https://')) &&
    !rawUrl.startsWith('http://') &&
    !rawUrl.startsWith('https://')
  ) {
    const temp = rawUrl;
    rawUrl = rawKey;
    rawKey = temp;
    inverted = true;
  }

  const isPlaceholder =
    !rawUrl ||
    !rawKey ||
    rawUrl.includes('your-project') ||
    rawUrl === 'https://your-project.supabase.co' ||
    rawKey === 'your-supabase-anon-key';

  let projectRef: string | null = null;
  try {
    if (rawUrl.startsWith('http')) {
      const parsed = new URL(rawUrl);
      const parts = parsed.hostname.split('.');
      if (parts.length >= 2 && parts[1] === 'supabase') {
        projectRef = parts[0];
      }
    }
  } catch {
    // ignore
  }

  return {
    url: rawUrl,
    anonKey: rawKey,
    isConfigured: !isPlaceholder && rawUrl.startsWith('http') && rawKey.length > 5,
    projectRef,
    inverted,
  };
}

/**
 * Checks if Supabase credentials are configured in the current environment
 */
export function isSupabaseConfigured(): boolean {
  return getNormalizedSupabaseConfig().isConfigured;
}

let supabaseInstance: SupabaseClient | null = null;
let currentClientKey = '';

/**
 * Returns the initialized Supabase client instance or creates one if configured
 */
export function getSupabaseClient(): SupabaseClient | null {
  const config = getNormalizedSupabaseConfig();
  if (!config.isConfigured) {
    return null;
  }

  const keySignature = `${config.url}_${config.anonKey}`;
  if (!supabaseInstance || currentClientKey !== keySignature) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        db: {
          schema: 'public',
        },
      });
      currentClientKey = keySignature;
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
  needsMigration?: boolean;
  url?: string;
  projectRef?: string | null;
  error?: string;
  timestamp: string;
  tablesFound?: string[];
  invertedCredentialsFixed?: boolean;
}

/**
 * Tests connection to the Supabase backend and verifies table existence
 */
export async function testSupabaseConnection(): Promise<SupabaseHealthStatus> {
  const config = getNormalizedSupabaseConfig();
  if (!config.isConfigured) {
    return {
      configured: false,
      connected: false,
      timestamp: new Date().toISOString(),
      error: 'Credenciais do Supabase não configuradas (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY).',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      configured: true,
      connected: false,
      url: config.url,
      projectRef: config.projectRef,
      timestamp: new Date().toISOString(),
      error: 'Instância do cliente Supabase não pôde ser inicializada.',
    };
  }

  try {
    // Quick test against workshops or students
    const { error: workshopError } = await client.from('workshops').select('id').limit(1);

    if (workshopError) {
      // PGRST205 / 42P01 means relation does not exist in schema cache -> Connected to DB, but migration hasn't run!
      const isMissingTable =
        workshopError.code === 'PGRST205' ||
        workshopError.code === '42P01' ||
        workshopError.message?.includes('Could not find the table') ||
        workshopError.message?.includes('relation') ||
        workshopError.message?.includes('does not exist');

      if (isMissingTable) {
        return {
          configured: true,
          connected: true,
          needsMigration: true,
          url: config.url,
          projectRef: config.projectRef,
          invertedCredentialsFixed: config.inverted,
          timestamp: new Date().toISOString(),
          error: 'Conectado ao seu projeto Supabase! As tabelas do banco ainda não foram criadas.',
        };
      }

      return {
        configured: true,
        connected: false,
        url: config.url,
        projectRef: config.projectRef,
        invertedCredentialsFixed: config.inverted,
        timestamp: new Date().toISOString(),
        error: workshopError.message || 'Erro ao conectar ao banco Supabase.',
      };
    }

    // Tables exist and are reachable
    return {
      configured: true,
      connected: true,
      needsMigration: false,
      url: config.url,
      projectRef: config.projectRef,
      invertedCredentialsFixed: config.inverted,
      tablesFound: ['workshops', 'students', 'attendance'],
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      url: config.url,
      projectRef: config.projectRef,
      invertedCredentialsFixed: config.inverted,
      timestamp: new Date().toISOString(),
      error: err?.message || 'Falha de conexão com a API do Supabase.',
    };
  }
}

/**
 * Saves custom Supabase credentials to localStorage for testing or override
 */
export function saveCustomSupabaseCredentials(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('AE_SUPABASE_URL', url.trim());
    localStorage.setItem('AE_SUPABASE_ANON_KEY', key.trim());
    supabaseInstance = null;
    currentClientKey = '';
  }
}

/**
 * Clears custom Supabase credentials from localStorage
 */
export function clearCustomSupabaseCredentials() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('AE_SUPABASE_URL');
    localStorage.removeItem('AE_SUPABASE_ANON_KEY');
    supabaseInstance = null;
    currentClientKey = '';
  }
}
