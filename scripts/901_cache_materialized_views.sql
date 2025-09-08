-- Materialized views to cache expensive metadata queries
-- Run this in your Supabase/Postgres database.

-- 1) Cache timezones
create materialized view if not exists mv_pg_timezone_names as
select name from pg_timezone_names order by name;

create unique index if not exists mv_pg_timezone_names_name_idx
  on mv_pg_timezone_names(name);

-- Refresh command (run on a schedule):
--   refresh materialized view concurrently mv_pg_timezone_names;


-- 2) Cache database schema (tables and columns) in a lightweight shape
--    This avoids running the very heavy pg_catalog/pg_constraint CTE each request.
--    You can extend this view with more attributes as needed.
create materialized view if not exists mv_db_schema as
with tables as (
  select
    c.oid::int8                  as table_id,
    n.nspname                    as schema,
    c.relname                    as name,
    c.relrowsecurity             as rls_enabled,
    c.relforcerowsecurity        as rls_forced,
    pg_total_relation_size(c.oid)::int8 as bytes,
    pg_size_pretty(pg_total_relation_size(c.oid)) as size
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where c.relkind in ('r','p') -- ordinary + partitioned tables
    and not pg_is_other_temp_schema(n.oid)
)
, columns as (
  select
    a.attrelid::int8       as table_id,
    a.attnum               as ordinal_position,
    a.attname              as name,
    format_type(a.atttypid, a.atttypmod) as data_type,
    col_description(a.attrelid, a.attnum) as comment,
    not a.attnotnull       as is_nullable
  from pg_attribute a
  where a.attnum > 0 and not a.attisdropped
)
select
  t.table_id as id,
  t.schema,
  t.name,
  t.rls_enabled,
  t.rls_forced,
  t.bytes,
  t.size,
  (
    select jsonb_agg(jsonb_build_object(
      'name', c.name,
      'ordinal_position', c.ordinal_position,
      'data_type', c.data_type,
      'is_nullable', c.is_nullable,
      'comment', c.comment
    ) order by c.ordinal_position)
    from columns c where c.table_id = t.table_id
  ) as columns
from tables t
order by t.schema, t.name;

create unique index if not exists mv_db_schema_id_idx
  on mv_db_schema(id);

-- Refresh command (run on a schedule):
--   refresh materialized view concurrently mv_db_schema;

-- Optional helper role grants (adjust as needed):
-- grant select on materialized view mv_pg_timezone_names to anon, authenticated;
-- grant select on materialized view mv_db_schema to anon, authenticated;
