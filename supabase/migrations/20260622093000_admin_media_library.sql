insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-videos',
  'product-videos',
  true,
  104857600,
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  url text not null,
  type text not null check (type in ('image', 'video')),
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists product_media_product_idx on public.product_media(product_id);
create index if not exists product_media_type_idx on public.product_media(type);

grant select on public.product_media to anon, authenticated;
grant insert, update, delete on public.product_media to authenticated;
grant all on public.product_media to service_role;

alter table public.product_media enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'product_media'
      and policyname = 'product media public read active products'
  ) then
    execute '
      create policy "product media public read active products"
        on public.product_media
        for select
        to anon, authenticated
        using (
          exists (
            select 1
            from public.products p
            where p.id = product_id
              and (p.is_active = true or public.has_role(auth.uid(), ''admin''))
          )
        )
    ';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'product_media'
      and policyname = 'admins manage product media'
  ) then
    execute '
      create policy "admins manage product media"
        on public.product_media
        for all
        to authenticated
        using (public.has_role(auth.uid(), ''admin''))
        with check (public.has_role(auth.uid(), ''admin''))
    ';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'product_videos_public_read'
  ) then
    execute '
      create policy "product_videos_public_read"
        on storage.objects
        for select
        to anon, authenticated
        using (bucket_id = ''product-videos'')
    ';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'product_videos_admin_insert'
  ) then
    execute '
      create policy "product_videos_admin_insert"
        on storage.objects
        for insert
        to authenticated
        with check (bucket_id = ''product-videos'' and public.has_role(auth.uid(), ''admin''))
    ';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'product_videos_admin_update'
  ) then
    execute '
      create policy "product_videos_admin_update"
        on storage.objects
        for update
        to authenticated
        using (bucket_id = ''product-videos'' and public.has_role(auth.uid(), ''admin''))
        with check (bucket_id = ''product-videos'' and public.has_role(auth.uid(), ''admin''))
    ';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'product_videos_admin_delete'
  ) then
    execute '
      create policy "product_videos_admin_delete"
        on storage.objects
        for delete
        to authenticated
        using (bucket_id = ''product-videos'' and public.has_role(auth.uid(), ''admin''))
    ';
  end if;
end $$;
