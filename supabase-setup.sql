-- TendDay: Supabase SQL Editor에 통째로 붙여넣고 Run 하세요.

-- 1) 데이터 테이블 (계정당 한 줄)
create table if not exists public.tendday_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.tendday_state enable row level security;

drop policy if exists "tendday own select" on public.tendday_state;
drop policy if exists "tendday own insert" on public.tendday_state;
drop policy if exists "tendday own update" on public.tendday_state;
create policy "tendday own select" on public.tendday_state for select using (auth.uid() = user_id);
create policy "tendday own insert" on public.tendday_state for insert with check (auth.uid() = user_id);
create policy "tendday own update" on public.tendday_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2) Glimmers 사진·영상 보관함 (비공개)
insert into storage.buckets (id, name, public) values ('glimmers', 'glimmers', false)
on conflict (id) do nothing;

drop policy if exists "tendday media select" on storage.objects;
drop policy if exists "tendday media insert" on storage.objects;
drop policy if exists "tendday media update" on storage.objects;
drop policy if exists "tendday media delete" on storage.objects;
create policy "tendday media select" on storage.objects for select
  using (bucket_id = 'glimmers' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "tendday media insert" on storage.objects for insert
  with check (bucket_id = 'glimmers' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "tendday media update" on storage.objects for update
  using (bucket_id = 'glimmers' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "tendday media delete" on storage.objects for delete
  using (bucket_id = 'glimmers' and (storage.foldername(name))[1] = auth.uid()::text);
