-- Design Ref: §3.3 — analysis_reports (개인정보 포함 가능 → service role 전용, 공개 SELECT 없음)
create table if not exists analysis_reports (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null unique references properties(id) on delete cascade,
  source_file_path text not null,
  rights jsonb not null default '[]',
  base_right_index smallint,
  tenant_info jsonb,
  assumed_burdens jsonb not null default '[]',
  expected_bid_range jsonb,
  explanation_text text not null default '',
  quality_flag text not null default 'ok' check (quality_flag in ('ok', 'needs_review')),
  created_at timestamptz default now()
);

create index if not exists idx_analysis_reports_property on analysis_reports (property_id);

alter table analysis_reports enable row level security;

-- Design Ref: §3.3 — 클라이언트 직접 접근 차단, API route(service role)를 통해서만 조회/기록
create policy "analysis_reports_service_role_only"
  on analysis_reports for all
  using (false);
