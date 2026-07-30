/**
 * Archivo obsoleto: server/db.ts
 *
 * La base de datos en memoria ha sido reemplazada por Supabase.
 * Los datos ahora se almacenan en las tablas de Supabase (ver supabase/schema.sql).
 *
 * Los controladores ahora utilizan `supabaseAdmin` desde `server/lib/supabase.ts`
 * para todas las operaciones de base de datos.
 *
 * Las constantes de IDs de referencia se mantienen aquí para compatibilidad histórica.
 */

export const SUPERADMIN_USER_ID = '00000000-0000-0000-0000-000000000001';
export const TENANT_1_ID = '11111111-1111-1111-1111-111111111111';
export const TENANT_2_ID = '22222222-2222-2222-2222-222222222222';
export const TENANT_3_ID = '33333333-3333-3333-3333-333333333333';
export const TENANT_1_ADMIN_ID = '11111111-0000-0000-0000-000000000001';
export const TENANT_2_ADMIN_ID = '22222222-0000-0000-0000-000000000001';
export const TENANT_3_ADMIN_ID = '33333333-0000-0000-0000-000000000001';
