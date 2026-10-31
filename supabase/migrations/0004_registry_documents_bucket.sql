-- Design Ref: §3.3, §7 — 등기부등본 원본 비공개 버킷, service role만 read/write
insert into storage.buckets (id, name, public)
values ('registry-documents', 'registry-documents', false)
on conflict (id) do nothing;

create policy "registry_documents_service_role_only"
  on storage.objects for all
  using (bucket_id = 'registry-documents' and auth.role() = 'service_role');
