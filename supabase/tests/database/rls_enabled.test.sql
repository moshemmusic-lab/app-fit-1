-- Guard rail (CLAUDE.md, data rule 2): every table in the public schema must have
-- Row Level Security enabled. If this fails, enable RLS in a new migration and add
-- explicit policies plus tests for who can read and write.
begin;

create extension if not exists pgtap with schema extensions;

select plan(1);

select is_empty(
  $$
    select c.relname::text
    from pg_class c
    where c.relnamespace = 'public'::regnamespace
      and c.relkind in ('r', 'p')
      and not c.relrowsecurity
  $$,
  'Every table in the public schema has RLS enabled'
);

select * from finish();

rollback;
