-- Design Ref: §3.3 — viewing_guides cache table (n8n writes via service role, app reads only)
create table if not exists viewing_guides (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null unique references properties(id) on delete cascade,
  infrastructure_summary text not null,
  checklist jsonb not null default '[]',
  nearby_prices jsonb not null default '[]',
  nearby_facilities jsonb not null default '[]',
  coordinates jsonb,
  generated_by text not null default 'gemini-flash',
  quality_flag text not null default 'ok' check (quality_flag in ('ok', 'needs_regeneration')),
  created_at timestamptz default now()
);

create index if not exists idx_viewing_guides_property on viewing_guides (property_id);

alter table viewing_guides enable row level security;

create policy "viewing_guides_public_read"
  on viewing_guides for select
  using (true);
