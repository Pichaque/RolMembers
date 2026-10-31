-- Migración 004: razas de comunidad y bucket de retratos de personaje.
-- Ejecutar en el editor SQL de Supabase DESPUÉS de la 003.
-- Path de retratos en Storage: {server_id}/{character_id}.{ext}
-- La ruta se guarda en characters.data.retrato (jsonb).

create table if not exists public.community_races (
  id uuid primary key default gen_random_uuid(),
  server_id uuid not null,
  name text not null,
  traits jsonb not null default '[]'::jsonb,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  unique (server_id, name)
);

alter table public.community_races enable row level security;

create policy community_races_select on public.community_races
  for select
  using (
    exists (
      select 1 from public.server_members m
      where m.server_id = community_races.server_id
        and m.user_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.global_role = 'admin'
    )
  );

create policy community_races_insert on public.community_races
  for insert
  with check (
    exists (
      select 1 from public.server_members m
      where m.server_id = community_races.server_id
        and m.user_id = auth.uid()
        and m.role = 'narrator'
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.global_role = 'admin'
    )
  );

create policy community_races_update on public.community_races
  for update
  using (
    exists (
      select 1 from public.server_members m
      where m.server_id = community_races.server_id
        and m.user_id = auth.uid()
        and m.role = 'narrator'
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.global_role = 'admin'
    )
  );

create policy community_races_delete on public.community_races
  for delete
  using (
    exists (
      select 1 from public.server_members m
      where m.server_id = community_races.server_id
        and m.user_id = auth.uid()
        and m.role = 'narrator'
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.global_role = 'admin'
    )
  );

insert into storage.buckets (id, name, public)
values ('retratos', 'retratos', true)
on conflict (id) do nothing;

create policy retratos_select on storage.objects
  for select
  using (
    bucket_id = 'retratos'
    and (
      exists (
        select 1 from public.server_members m
        where m.server_id = (split_part(name, '/', 1))::uuid
          and m.user_id = auth.uid()
      )
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.global_role = 'admin'
      )
    )
  );

create policy retratos_insert on storage.objects
  for insert
  with check (
    bucket_id = 'retratos'
    and (
      exists (
        select 1 from public.characters c
        where c.server_id = (split_part(name, '/', 1))::uuid
          and c.id::text = split_part(split_part(name, '/', 2), '.', 1)
          and c.owner_id = auth.uid()
      )
      or exists (
        select 1 from public.server_members m
        where m.server_id = (split_part(name, '/', 1))::uuid
          and m.user_id = auth.uid()
          and m.role = 'narrator'
      )
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.global_role = 'admin'
      )
    )
  );

create policy retratos_update on storage.objects
  for update
  using (
    bucket_id = 'retratos'
    and (
      exists (
        select 1 from public.characters c
        where c.server_id = (split_part(name, '/', 1))::uuid
          and c.id::text = split_part(split_part(name, '/', 2), '.', 1)
          and c.owner_id = auth.uid()
      )
      or exists (
        select 1 from public.server_members m
        where m.server_id = (split_part(name, '/', 1))::uuid
          and m.user_id = auth.uid()
          and m.role = 'narrator'
      )
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.global_role = 'admin'
      )
    )
  );

create policy retratos_delete on storage.objects
  for delete
  using (
    bucket_id = 'retratos'
    and (
      exists (
        select 1 from public.characters c
        where c.server_id = (split_part(name, '/', 1))::uuid
          and c.id::text = split_part(split_part(name, '/', 2), '.', 1)
          and c.owner_id = auth.uid()
      )
      or exists (
        select 1 from public.server_members m
        where m.server_id = (split_part(name, '/', 1))::uuid
          and m.user_id = auth.uid()
          and m.role = 'narrator'
      )
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.global_role = 'admin'
      )
    )
  );
