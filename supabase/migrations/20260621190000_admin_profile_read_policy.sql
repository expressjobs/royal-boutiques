do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'admins read all profiles'
  ) then
    execute '
      create policy "admins read all profiles"
        on public.profiles
        for select
        to authenticated
        using (public.has_role(auth.uid(), ''admin''))
    ';
  end if;
end $$;
