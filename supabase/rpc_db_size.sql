-- ════════════════════════════════════════════════════════════════════
-- rpc_db_size.sql
-- Run this in your Supabase SQL Editor to allow the monitoring script
-- to fetch the current database size in bytes.
-- ════════════════════════════════════════════════════════════════════

create or replace function get_db_size_bytes() 
returns bigint as $$
  select pg_database_size(current_database())::bigint;
$$ language sql security definer;
