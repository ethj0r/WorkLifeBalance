-- ============================================================
-- CarbonLink MVP — Initial Schema
-- Migration 001: Tables, indexes, constraints
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- ─────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────
create type plot_status as enum (
  'pending',
  'verifying',
  'verified',
  'credit_issued'
);

create type ownership_type as enum (
  'self',
  'on_behalf'
);

create type land_type as enum (
  'agroforestri',
  'kebun_campur',
  'kebun_monokultur',
  'sawah_pohon_penyangga',
  'hutan_adat',
  'lainnya'
);

create type document_type as enum (
  'sertifikat',
  'sppt',
  'surat_keterangan_tanah',
  'lainnya'
);

create type transaction_type as enum (
  'credit_issued',
  'credit_sold',
  'withdrawal'
);

create type transaction_status as enum (
  'pending',
  'completed',
  'failed'
);

-- ─────────────────────────────────────────────────────────────
-- Table: users (profiles — references auth.users)
-- Note: ID matches auth.users.id (1:1 relationship)
-- ─────────────────────────────────────────────────────────────
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  phone_number text unique not null,
  display_name text not null default '',
  province text,
  regency text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_users_phone on public.users(phone_number);

-- ─────────────────────────────────────────────────────────────
-- Table: user_identities (data diri pendaftar — auto-fill cache)
-- ─────────────────────────────────────────────────────────────
create table public.user_identities (
  user_id uuid primary key references public.users(id) on delete cascade,
  full_name text not null,
  nik text not null,
  ktp_photo_url text,
  verified_at timestamptz,
  updated_at timestamptz default now() not null,
  constraint nik_format check (char_length(nik) = 16 and nik ~ '^[0-9]+$')
);

create index idx_user_identities_nik on public.user_identities(nik);

-- ─────────────────────────────────────────────────────────────
-- Table: land_owners (pemilik lahan — separate entity)
-- One NIK = one record (deduped untuk cross-plot lookup)
-- ─────────────────────────────────────────────────────────────
create table public.land_owners (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  nik text unique not null,
  birthdate date,
  ktp_photo_url text,
  phone_number text,
  created_by_user_id uuid not null references public.users(id) on delete restrict,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint owner_nik_format check (char_length(nik) = 16 and nik ~ '^[0-9]+$')
);

create index idx_land_owners_nik on public.land_owners(nik);
create index idx_land_owners_created_by on public.land_owners(created_by_user_id);

-- ─────────────────────────────────────────────────────────────
-- Table: plots (lahan)
-- ─────────────────────────────────────────────────────────────
create table public.plots (
  id uuid primary key default uuid_generate_v4(),
  account_holder_id uuid not null references public.users(id) on delete cascade,
  land_owner_id uuid not null references public.land_owners(id) on delete restrict,

  name text not null,
  polygon_geojson jsonb not null,
  area_hectares numeric(8, 4) not null,
  address text,

  land_type land_type,
  managed_since_year integer,
  dominant_tree_types text[] default array[]::text[],
  estimated_tree_count integer,

  ownership_type ownership_type not null,
  consent_acknowledged boolean default false not null,
  ownership_relationship text,

  status plot_status default 'pending' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  constraint area_range check (area_hectares >= 0.1 and area_hectares <= 50),
  constraint year_range check (managed_since_year is null or (managed_since_year >= 1950 and managed_since_year <= extract(year from current_date)::int)),
  constraint name_length check (char_length(name) >= 2 and char_length(name) <= 100)
);

create index idx_plots_account_holder on public.plots(account_holder_id);
create index idx_plots_land_owner on public.plots(land_owner_id);
create index idx_plots_status on public.plots(status);
create index idx_plots_created_at on public.plots(created_at desc);

-- ─────────────────────────────────────────────────────────────
-- Table: plot_documents (sertifikat, SPPT, dll)
-- ─────────────────────────────────────────────────────────────
create table public.plot_documents (
  id uuid primary key default uuid_generate_v4(),
  plot_id uuid not null references public.plots(id) on delete cascade,
  document_type document_type not null,
  file_url text not null,
  file_name text,
  file_size_bytes integer,
  uploaded_at timestamptz default now() not null
);

create index idx_plot_documents_plot on public.plot_documents(plot_id);

-- ─────────────────────────────────────────────────────────────
-- Table: plot_photos (foto kondisi lahan)
-- ─────────────────────────────────────────────────────────────
create table public.plot_photos (
  id uuid primary key default uuid_generate_v4(),
  plot_id uuid not null references public.plots(id) on delete cascade,
  file_url text not null,
  ai_analysis_result jsonb,  -- bounding boxes, tree count, dll
  uploaded_at timestamptz default now() not null
);

create index idx_plot_photos_plot on public.plot_photos(plot_id);

-- ─────────────────────────────────────────────────────────────
-- Table: verifications (hasil verifikasi cross-validated)
-- One record per plot (1:1 setelah verification done)
-- ─────────────────────────────────────────────────────────────
create table public.verifications (
  id uuid primary key default uuid_generate_v4(),
  plot_id uuid unique not null references public.plots(id) on delete cascade,

  ndvi_score numeric(4, 3),  -- 0.000 to 1.000
  tree_count_satellite integer,
  tree_count_photo integer,
  confidence_score integer,  -- 0 to 100

  imagery_date date,
  imagery_source text default 'sentinel-2',

  verified_at timestamptz default now() not null,

  constraint ndvi_range check (ndvi_score is null or (ndvi_score >= 0 and ndvi_score <= 1)),
  constraint confidence_range check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 100))
);

create index idx_verifications_plot on public.verifications(plot_id);

-- ─────────────────────────────────────────────────────────────
-- Table: carbon_estimates (hasil estimasi carbon stock)
-- One record per plot (latest version)
-- ─────────────────────────────────────────────────────────────
create table public.carbon_estimates (
  id uuid primary key default uuid_generate_v4(),
  plot_id uuid unique not null references public.plots(id) on delete cascade,

  annual_sequestration_tco2e numeric(10, 4) not null,
  total_stored_tco2e numeric(10, 4) not null,
  confidence_range_low numeric(10, 4) not null,
  confidence_range_high numeric(10, 4) not null,
  methodology text not null default 'IPCC Tier 1 — Tropical Agroforestry',

  calculated_at timestamptz default now() not null,

  constraint sequestration_positive check (annual_sequestration_tco2e >= 0),
  constraint range_valid check (confidence_range_low <= annual_sequestration_tco2e and annual_sequestration_tco2e <= confidence_range_high)
);

create index idx_carbon_estimates_plot on public.carbon_estimates(plot_id);

-- ─────────────────────────────────────────────────────────────
-- Table: transactions (mock — credit issuance, sales, withdrawals)
-- ─────────────────────────────────────────────────────────────
create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  plot_id uuid references public.plots(id) on delete set null,

  transaction_type transaction_type not null,
  amount_idr bigint not null,
  tco2e_amount numeric(10, 4),
  status transaction_status default 'completed' not null,

  buyer_name text,  -- kalau type = credit_sold, nama buyer (untuk display)
  reference_id text,  -- mock blockchain hash atau payment gateway ID

  created_at timestamptz default now() not null,

  constraint amount_positive check (amount_idr >= 0)
);

create index idx_transactions_user on public.transactions(user_id, created_at desc);
create index idx_transactions_plot on public.transactions(plot_id);
create index idx_transactions_type on public.transactions(transaction_type);

-- ─────────────────────────────────────────────────────────────
-- Auto-update timestamps trigger
-- ─────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at before update on public.users
  for each row execute function public.set_updated_at();

create trigger user_identities_updated_at before update on public.user_identities
  for each row execute function public.set_updated_at();

create trigger land_owners_updated_at before update on public.land_owners
  for each row execute function public.set_updated_at();

create trigger plots_updated_at before update on public.plots
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Comments untuk schema introspection
-- ─────────────────────────────────────────────────────────────
comment on table public.users is 'User profiles, 1:1 dengan auth.users';
comment on table public.user_identities is 'Data legal pendaftar (NIK + KTP) — cached untuk auto-fill di add lahan';
comment on table public.land_owners is 'Pemilik lahan separate entity — satu NIK = satu record (dedupe lintas plot)';
comment on table public.plots is 'Lahan dengan polygon, ownership info, status lifecycle';
comment on table public.verifications is 'Hasil verifikasi satellite + photo + cross-validation';
comment on table public.carbon_estimates is 'Estimasi carbon stock pakai IPCC methodology';
comment on table public.transactions is 'Mock financial transactions — credit issuance, sales, withdrawal';