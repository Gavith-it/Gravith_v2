create or replace function public.create_organization_with_owner(
  p_name text,
  p_user_id uuid,
  p_user_email text,
  p_user_first_name text,
  p_user_last_name text
)
returns organizations
language plpgsql
security definer
as $$
declare
  v_org organizations;
begin
  insert into organizations (name, is_active, created_by)
  values (p_name, true, p_user_id)
  returning * into v_org;

  insert into user_profiles (
    id,
    username,
    email,
    first_name,
    last_name,
    role,
    organization_id,
    organization_role,
    is_active
  )
  values (
    p_user_id,
    split_part(p_user_email, '@', 1),
    p_user_email,
    nullif(p_user_first_name, ''),
    nullif(p_user_last_name, ''),
    'admin',
    v_org.id,
    'owner',
    true
  );

  return v_org;
end;
$$;

grant execute on function public.create_organization_with_owner(text, uuid, text, text, text) to anon, authenticated, service_role;

