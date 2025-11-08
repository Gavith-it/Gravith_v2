alter table public.organizations enable row level security;
alter table public.user_profiles enable row level security;

create policy "Members can view organization"
on public.organizations
for select
using (
  exists (
    select 1
    from public.user_profiles as me
    where me.id = auth.uid()
      and me.organization_id = organizations.id
  )
);

create policy "Members can view organization peers"
on public.user_profiles
for select
using (
  exists (
    select 1
    from public.user_profiles as me
    where me.id = auth.uid()
      and me.organization_id = user_profiles.organization_id
  )
);

