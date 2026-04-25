-- ============================================================
-- Migration 003: Auth Trigger — auto-create public.users
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Function yang jalan saat new auth.user dibuat.
-- Extract phone_number dari user_metadata, create row di public.users.
--
-- Note: Kita pakai pattern email pseudo (`{phone}@carbonlink.demo`),
-- jadi phone_number harus disimpan eksplisit di metadata saat
-- createUser dipanggil dari verifyOtpAction.
-- ─────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Extract phone_number dari user_metadata
  -- Fallback ke email kalau metadata tidak ada (edge case)
  insert into public.users (id, phone_number, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'phone_number',
      new.email  -- fallback
    ),
    ''  -- empty display_name; user akan fill di onboarding
  )
  on conflict (id) do nothing;  -- idempotent

  return new;
end;
$$;

-- Trigger di auth.users
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();