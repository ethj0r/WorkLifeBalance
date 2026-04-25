-- ============================================================
-- Migration 004: Seed Data untuk Demo
-- ============================================================
-- Run ini SETELAH ada minimal 1 user real (sign up via app dulu)
-- atau skip dan biarkan demo flow jalan dari user baru.
--
-- Untuk easiest setup: sign up via app pakai phone +6281234567890
-- (login dengan OTP 123456), lalu update phone di seed ini ke yang
-- match dengan user kamu, atau pakai variable.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Variables (ganti DEMO_USER_ID dengan UUID user kamu)
-- ─────────────────────────────────────────────────────────────
do $$
declare
  -- Ganti dengan ID user yang sudah sign up. Cara dapat:
  --   select id from auth.users limit 1;
  -- atau cek di Supabase dashboard → Authentication → Users
  demo_user_id uuid := (select id from auth.users limit 1);

  owner_self_id uuid;
  owner_kerabat_id uuid;

  plot_1_id uuid;
  plot_2_id uuid;
  plot_3_id uuid;

begin
  if demo_user_id is null then
    raise notice 'No auth user found — sign up via app first, then re-run this migration';
    return;
  end if;

  -- ─── Update demo user profile ───
  update public.users
  set
    display_name = 'Pak Asep',
    province = 'Jawa Barat',
    regency = 'Cianjur'
  where id = demo_user_id;

  -- ─── User identity (data diri pendaftar) ───
  insert into public.user_identities (user_id, full_name, nik, ktp_photo_url, verified_at)
  values (
    demo_user_id,
    'Asep Suryadi',
    '3201987654321098',
    'mock://demo-asep-ktp.jpg',
    now()
  )
  on conflict (user_id) do update set
    full_name = excluded.full_name,
    nik = excluded.nik,
    ktp_photo_url = excluded.ktp_photo_url,
    verified_at = excluded.verified_at;

  -- ─── Land owner: self (untuk plot 1 & 3) ───
  insert into public.land_owners (full_name, nik, ktp_photo_url, created_by_user_id)
  values (
    'Asep Suryadi',
    '3201987654321098',
    'mock://demo-asep-ktp.jpg',
    demo_user_id
  )
  on conflict (nik) do update set updated_at = now()
  returning id into owner_self_id;

  -- ─── Land owner: kerabat (untuk plot 2 — on_behalf demo) ───
  insert into public.land_owners (full_name, nik, ktp_photo_url, phone_number, created_by_user_id)
  values (
    'Sukro Hadiman',
    '3201123456789012',
    'mock://demo-sukro-ktp.jpg',
    '+6281298765432',
    demo_user_id
  )
  on conflict (nik) do update set updated_at = now()
  returning id into owner_kerabat_id;

  -- ─────────────────────────────────────────────────────────
  -- Plot 1 — Kebun Kopi Sumber Asih (credit_issued, with activity)
  -- ─────────────────────────────────────────────────────────
  insert into public.plots (
    account_holder_id, land_owner_id, name, polygon_geojson, area_hectares,
    address, land_type, managed_since_year, dominant_tree_types,
    estimated_tree_count, ownership_type, consent_acknowledged, status,
    created_at
  ) values (
    demo_user_id,
    owner_self_id,
    'Kebun Kopi Sumber Asih',
    '{
      "type": "Polygon",
      "coordinates": [[
        [107.0150, -6.8160],
        [107.0175, -6.8158],
        [107.0180, -6.8170],
        [107.0170, -6.8180],
        [107.0155, -6.8178],
        [107.0148, -6.8170],
        [107.0150, -6.8160]
      ]]
    }'::jsonb,
    2.4,
    'Desa Sumber Asih, Cianjur, Jawa Barat',
    'agroforestri',
    2018,
    array['Kopi', 'Sengon', 'Mahoni'],
    142,
    'self',
    true,
    'credit_issued',
    now() - interval '45 days'
  ) returning id into plot_1_id;

  -- Plot 1: photos (3)
  insert into public.plot_photos (plot_id, file_url, ai_analysis_result) values
    (plot_1_id, 'mock://plot1-photo1.jpg', '{"tree_count": 16, "bounding_boxes": [], "model_version": "deepforest-v1"}'::jsonb),
    (plot_1_id, 'mock://plot1-photo2.jpg', '{"tree_count": 18, "bounding_boxes": [], "model_version": "deepforest-v1"}'::jsonb),
    (plot_1_id, 'mock://plot1-photo3.jpg', '{"tree_count": 13, "bounding_boxes": [], "model_version": "deepforest-v1"}'::jsonb);

  -- Plot 1: verification
  insert into public.verifications (
    plot_id, ndvi_score, tree_count_satellite, tree_count_photo,
    confidence_score, imagery_date, verified_at
  ) values (
    plot_1_id, 0.72, 52, 47, 89,
    current_date - interval '30 days',
    now() - interval '30 days'
  );

  -- Plot 1: carbon estimate (24 ton CO2e/tahun)
  insert into public.carbon_estimates (
    plot_id, annual_sequestration_tco2e, total_stored_tco2e,
    confidence_range_low, confidence_range_high, methodology
  ) values (
    plot_1_id, 14.2, 138.0, 11.8, 16.6,
    'IPCC Tier 1 — Tropical Agroforestry'
  );

  -- Plot 1: transactions
  insert into public.transactions (
    user_id, plot_id, transaction_type, amount_idr, tco2e_amount,
    status, buyer_name, reference_id, created_at
  ) values
    (demo_user_id, plot_1_id, 'credit_issued', 0, 3.5, 'completed', null, '0x4a7b9c2e', now() - interval '13 days'),
    (demo_user_id, plot_1_id, 'credit_sold', 245000, 3.5, 'completed', 'PT Hijau Lestari', 'PT-HL-2026-04', now() - interval '7 days');

  -- ─────────────────────────────────────────────────────────
  -- Plot 2 — Kebun Cengkeh Pak Sukro (verified, on_behalf)
  -- ─────────────────────────────────────────────────────────
  insert into public.plots (
    account_holder_id, land_owner_id, name, polygon_geojson, area_hectares,
    address, land_type, managed_since_year, dominant_tree_types,
    estimated_tree_count, ownership_type, consent_acknowledged,
    ownership_relationship, status, created_at
  ) values (
    demo_user_id,
    owner_kerabat_id,
    'Kebun Cengkeh Pak Sukro',
    '{
      "type": "Polygon",
      "coordinates": [[
        [107.8900, -7.2050],
        [107.8920, -7.2048],
        [107.8925, -7.2058],
        [107.8918, -7.2065],
        [107.8905, -7.2063],
        [107.8898, -7.2058],
        [107.8900, -7.2050]
      ]]
    }'::jsonb,
    1.8,
    'Garut, Jawa Barat',
    'kebun_campur',
    2015,
    array['Cengkeh', 'Kopi', 'Sengon'],
    null,
    'on_behalf',
    true,
    'tetangga',
    'verified',
    now() - interval '15 days'
  ) returning id into plot_2_id;

  insert into public.plot_photos (plot_id, file_url) values
    (plot_2_id, 'mock://plot2-photo1.jpg'),
    (plot_2_id, 'mock://plot2-photo2.jpg'),
    (plot_2_id, 'mock://plot2-photo3.jpg'),
    (plot_2_id, 'mock://plot2-photo4.jpg');

  insert into public.verifications (
    plot_id, ndvi_score, tree_count_satellite, tree_count_photo,
    confidence_score, imagery_date
  ) values (
    plot_2_id, 0.65, 28, 31, 84,
    current_date - interval '12 days'
  );

  insert into public.carbon_estimates (
    plot_id, annual_sequestration_tco2e, total_stored_tco2e,
    confidence_range_low, confidence_range_high, methodology
  ) values (
    plot_2_id, 9.8, 86.0, 8.2, 11.4,
    'IPCC Tier 1 — Tropical Agroforestry'
  );

  -- ─────────────────────────────────────────────────────────
  -- Plot 3 — Hutan Adat Cipanas (verifying, latest)
  -- ─────────────────────────────────────────────────────────
  insert into public.plots (
    account_holder_id, land_owner_id, name, polygon_geojson, area_hectares,
    address, land_type, managed_since_year, dominant_tree_types,
    estimated_tree_count, ownership_type, consent_acknowledged, status,
    created_at
  ) values (
    demo_user_id,
    owner_self_id,
    'Hutan Adat Cipanas',
    '{
      "type": "Polygon",
      "coordinates": [[
        [106.9520, -6.7930],
        [106.9550, -6.7928],
        [106.9560, -6.7945],
        [106.9540, -6.7958],
        [106.9520, -6.7955],
        [106.9510, -6.7942],
        [106.9520, -6.7930]
      ]]
    }'::jsonb,
    3.0,
    'Sukabumi, Jawa Barat',
    'hutan_adat',
    1998,
    array['Mahoni', 'Jati', 'Sengon', 'Kemiri'],
    null,
    'self',
    true,
    'verifying',
    now() - interval '1 day'
  ) returning id into plot_3_id;

  insert into public.plot_photos (plot_id, file_url) values
    (plot_3_id, 'mock://plot3-photo1.jpg'),
    (plot_3_id, 'mock://plot3-photo2.jpg'),
    (plot_3_id, 'mock://plot3-photo3.jpg');

  raise notice 'Seed data created: % plots for user %', 3, demo_user_id;
end $$;