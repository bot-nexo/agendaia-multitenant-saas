import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    '[Supabase Admin] SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configurados. ' +
    'El backend no podrá acceder a la base de datos. ' +
    'Verifique su archivo .env y la variable SUPABASE_SERVICE_ROLE_KEY.'
  );
}

let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

try {
  _supabaseAdmin = createClient(supabaseUrl as string, supabaseServiceKey as string, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
  } as any);
} catch (err) {
  console.error('[Supabase Admin] Error al inicializar el cliente:', err);
}

export const supabaseAdmin = _supabaseAdmin as any;
