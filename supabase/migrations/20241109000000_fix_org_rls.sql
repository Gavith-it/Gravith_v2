alter table public.organizations enable row level security;
alter table public.user_profiles enable row level security;

drop policy if exists "Members can view organization" on public.organizations;
drop policy if exists "Members can view organization peers" on public.user_profiles;

create or replace function public.user_is_member_of_org(p_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_profiles
    where id = auth.uid()
      and organization_id = p_org_id
  );
$$;

revoke execute on function public.user_is_member_of_org(uuid) from public;
grant execute on function public.user_is_member_of_org(uuid) to authenticated, service_role, anon;

create policy "Members can view organization"
on public.organizations
for select
using (public.user_is_member_of_org(organizations.id));

create policy "Members can view organization peers"
on public.user_profiles
for select
using (public.user_is_member_of_org(user_profiles.organization_id));

