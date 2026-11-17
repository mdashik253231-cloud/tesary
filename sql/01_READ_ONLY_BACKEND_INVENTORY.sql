
-- TREASURY BACKEND INVENTORY
-- READ ONLY: এই Query কোনো Table, Balance, Policy বা Function পরিবর্তন করে না।
-- Supabase Dashboard > SQL Editor-এ চালিয়ে বর্তমান Backend structure দেখুন।

WITH table_info AS (
  SELECT jsonb_agg(jsonb_build_object(
    'table', c.table_name,
    'columns', (
      SELECT jsonb_agg(jsonb_build_object(
        'name', col.column_name,
        'type', col.data_type,
        'udt', col.udt_name,
        'nullable', col.is_nullable,
        'default', col.column_default
      ) ORDER BY col.ordinal_position)
      FROM information_schema.columns col
      WHERE col.table_schema = c.table_schema
        AND col.table_name = c.table_name
    )
  ) ORDER BY c.table_name) AS data
  FROM information_schema.tables c
  WHERE c.table_schema = 'public'
    AND c.table_type = 'BASE TABLE'
),
policy_info AS (
  SELECT jsonb_agg(jsonb_build_object(
    'table', schemaname || '.' || tablename,
    'policy', policyname,
    'command', cmd,
    'roles', roles,
    'using', qual,
    'with_check', with_check
  ) ORDER BY tablename, policyname) AS data
  FROM pg_policies
  WHERE schemaname = 'public'
),
function_info AS (
  SELECT jsonb_agg(jsonb_build_object(
    'signature', p.oid::regprocedure::text,
    'definition', pg_get_functiondef(p.oid)
  ) ORDER BY p.proname, p.oid) AS data
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prokind = 'f'
)
SELECT jsonb_pretty(jsonb_build_object(
  'project_note', 'Treasuryio Backend Inventory',
  'tables', COALESCE((SELECT data FROM table_info), '[]'::jsonb),
  'rls_policies', COALESCE((SELECT data FROM policy_info), '[]'::jsonb),
  'sql_functions', COALESCE((SELECT data FROM function_info), '[]'::jsonb)
)) AS treasury_backend_inventory;
