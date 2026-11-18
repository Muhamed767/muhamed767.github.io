-- Public catalog only. Customer requests stay in the existing messenger flow.
create table public.site_catalog (
  id text primary key check (id = 'customcarsb'),
  payload jsonb not null check (
    jsonb_typeof(payload->'settings') = 'object'
    and jsonb_typeof(payload->'cars') = 'array'
    and payload ? 'settings' and payload ? 'cars'
  ),
  published boolean not null default false
);
alter table public.site_catalog enable row level security;
revoke all on public.site_catalog from public, anon, authenticated;
grant select on public.site_catalog to anon, authenticated;
create policy "Read published catalog" on public.site_catalog
  for select to anon, authenticated using (published = true);
comment on table public.site_catalog is
  'CUSTOMCARS B public catalog. Edit through Supabase Dashboard; browser writes are prohibited.';
