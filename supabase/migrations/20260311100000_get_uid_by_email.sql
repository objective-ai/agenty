-- Lookup auth.users.id by email. Callable only via service_role (RPC).
-- Required because @supabase/supabase-js v2.99 admin API lacks getUserByEmail.

create or replace function public.get_uid_by_email(lookup_email text)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select id from auth.users where email = lookup_email limit 1;
$$;

-- Revoke from public/anon so only service_role can call this
revoke execute on function public.get_uid_by_email(text) from public;
revoke execute on function public.get_uid_by_email(text) from anon;
revoke execute on function public.get_uid_by_email(text) from authenticated;
