-- ============================================================
-- Migration 002: Row Level Security Policies
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Enable RLS pada semua tables
-- ─────────────────────────────────────────────────────────────
alter table public.users enable row level security;
alter table public.user_identities enable row level security;
alter table public.land_owners enable row level security;
alter table public.plots enable row level security;
alter table public.plot_documents enable row level security;
alter table public.plot_photos enable row level security;
alter table public.verifications enable row level security;
alter table public.carbon_estimates enable row level security;
alter table public.transactions enable row level security;

-- ─────────────────────────────────────────────────────────────
-- users — user hanya bisa akses & update profile sendiri
-- ─────────────────────────────────────────────────────────────
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────
-- user_identities — same pattern
-- ─────────────────────────────────────────────────────────────
create policy "Users can manage own identity"
  on public.user_identities for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- land_owners — user bisa lihat dan create owner records
-- yang dia create. Tidak bisa lihat owner records dari user lain
-- (privacy untuk NIK orang lain).
-- ─────────────────────────────────────────────────────────────
create policy "Users can view land_owners they created"
  on public.land_owners for select
  using (auth.uid() = created_by_user_id);

create policy "Users can insert land_owners"
  on public.land_owners for insert
  with check (auth.uid() = created_by_user_id);

create policy "Users can update land_owners they created"
  on public.land_owners for update
  using (auth.uid() = created_by_user_id);

-- Catatan: dalam production, multi-tenant koperasi mungkin butuh policy
-- yang lebih kompleks (pengurus koperasi bisa lihat semua land_owners di koperasinya).
-- Untuk MVP, single-tenant model sudah cukup.

-- ─────────────────────────────────────────────────────────────
-- plots — user hanya bisa akses plot yang dia register
-- (sebagai account_holder)
-- ─────────────────────────────────────────────────────────────
create policy "Users can view own plots"
  on public.plots for select
  using (auth.uid() = account_holder_id);

create policy "Users can insert own plots"
  on public.plots for insert
  with check (auth.uid() = account_holder_id);

create policy "Users can update own plots"
  on public.plots for update
  using (auth.uid() = account_holder_id);

create policy "Users can delete own plots"
  on public.plots for delete
  using (auth.uid() = account_holder_id);

-- ─────────────────────────────────────────────────────────────
-- plot_documents — akses follow plot ownership
-- ─────────────────────────────────────────────────────────────
create policy "Users can view documents of own plots"
  on public.plot_documents for select
  using (
    exists (
      select 1 from public.plots
      where plots.id = plot_documents.plot_id
      and plots.account_holder_id = auth.uid()
    )
  );

create policy "Users can insert documents to own plots"
  on public.plot_documents for insert
  with check (
    exists (
      select 1 from public.plots
      where plots.id = plot_documents.plot_id
      and plots.account_holder_id = auth.uid()
    )
  );

create policy "Users can delete documents of own plots"
  on public.plot_documents for delete
  using (
    exists (
      select 1 from public.plots
      where plots.id = plot_documents.plot_id
      and plots.account_holder_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- plot_photos — akses follow plot ownership
-- ─────────────────────────────────────────────────────────────
create policy "Users can view photos of own plots"
  on public.plot_photos for select
  using (
    exists (
      select 1 from public.plots
      where plots.id = plot_photos.plot_id
      and plots.account_holder_id = auth.uid()
    )
  );

create policy "Users can manage photos of own plots"
  on public.plot_photos for all
  using (
    exists (
      select 1 from public.plots
      where plots.id = plot_photos.plot_id
      and plots.account_holder_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.plots
      where plots.id = plot_photos.plot_id
      and plots.account_holder_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- verifications — user bisa view, system (service role) yang insert
-- ─────────────────────────────────────────────────────────────
create policy "Users can view verifications of own plots"
  on public.verifications for select
  using (
    exists (
      select 1 from public.plots
      where plots.id = verifications.plot_id
      and plots.account_holder_id = auth.uid()
    )
  );

-- Insert/update via service role only (bypasses RLS)
-- Server Action yang panggil verification pipeline pakai service client.

-- ─────────────────────────────────────────────────────────────
-- carbon_estimates — same pattern
-- ─────────────────────────────────────────────────────────────
create policy "Users can view carbon_estimates of own plots"
  on public.carbon_estimates for select
  using (
    exists (
      select 1 from public.plots
      where plots.id = carbon_estimates.plot_id
      and plots.account_holder_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- transactions — user bisa lihat transaksi sendiri
-- Insert via service role (untuk credit issuance simulation)
-- atau via withdrawal Server Action
-- ─────────────────────────────────────────────────────────────
create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- Storage bucket policies
-- ─────────────────────────────────────────────────────────────

-- ktp-photos: private bucket, user hanya akses file sendiri
create policy "Users can upload own KTP"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'ktp-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view own KTP"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'ktp-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- legal-documents: private bucket, sama pattern
create policy "Users can upload own legal docs"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'legal-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view own legal docs"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'legal-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- plot-photos: public bucket (boleh dibaca anyone, supaya AI service bisa fetch)
-- tapi upload tetap restricted ke owner
create policy "Anyone can view plot photos"
  on storage.objects for select
  using (bucket_id = 'plot-photos');

create policy "Users can upload own plot photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'plot-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own plot photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'plot-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );