-- Design Ref: §3.3 — properties core table
create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  case_number text not null unique,
  type text not null check (type in ('auction', 'public_sale')),
  category text not null,
  sido text not null,
  sigungu text not null,
  eupmyeondong text,
  address text not null,
  appraisal_value bigint not null,
  min_bid bigint not null,
  fail_count smallint not null default 0,
  sale_date date not null,
  zone_type text,
  status text not null default 'active' check (status in ('active', 'sold', 'cancelled')),
  images text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_properties_filter
  on properties (status, sido, sigungu, category, sale_date);
create index if not exists idx_properties_appraisal on properties (appraisal_value);
create index if not exists idx_properties_min_bid on properties (min_bid);
create index if not exists idx_properties_fail_count on properties (fail_count);

-- Design Ref: §7 Security — RLS: anon read-only, writes via service role only (n8n)
alter table properties enable row level security;

create policy "properties_public_read"
  on properties for select
  using (true);
