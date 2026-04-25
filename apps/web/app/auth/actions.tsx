'use server';

import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server';

const DEMO_OTP = '123456';

interface SendOtpResult {
  success: boolean;
  error?: string;
}

interface VerifyOtpResult {
  success: boolean;
  isNewUser?: boolean;
  error?: string;
}

/**
 * Send OTP — mock for demo. Production: integrate dengan WA Business API
 * atau Twilio/Fonnte/Wablas.
 */
export async function sendOtpAction(
  phoneNumber: string
): Promise<SendOtpResult> {
  // Validation
  if (!phoneNumber.startsWith('+62')) {
    return { success: false, error: 'Format nomor HP tidak valid' };
  }
  const cleanPhone = phoneNumber.slice(3).replace(/\D/g, '');
  if (cleanPhone.length < 9 || cleanPhone.length > 13) {
    return { success: false, error: 'Nomor HP harus 9–13 digit' };
  }

  // Mock send — log untuk debugging
  console.log(`[MOCK OTP] Sending ${DEMO_OTP} to ${phoneNumber}`);

  // Simulate network delay untuk realism
  await new Promise((r) => setTimeout(r, 500));

  return { success: true };
}

/**
 * Verify OTP dan create/login user.
 *
 * Flow:
 *   1. Validate OTP (mock: harus '123456')
 *   2. Create Supabase auth user kalau belum ada (via service role)
 *   3. Sign in user (set auth cookie)
 *   4. Return whether user is new (untuk routing ke onboarding atau home)
 */
export async function verifyOtpAction(
  phoneNumber: string,
  code: string
): Promise<VerifyOtpResult> {
  if (code !== DEMO_OTP) {
    return { success: false, error: 'Kode OTP salah' };
  }

  if (!phoneNumber.startsWith('+62')) {
    return { success: false, error: 'Format nomor HP tidak valid' };
  }

  try {
    const supabase = createSupabaseServerClient();
    const adminSupabase = createSupabaseServiceClient();

    // Cek apakah user sudah ada di public.users
    const { data: existingProfile } = await adminSupabase
      .from('users')
      .select('id, display_name')
      .eq('phone_number', phoneNumber)
      .maybeSingle();

    let userId: string;
    let isNewUser = false;

    if (existingProfile) {
      // User existing — gunakan ID
      userId = existingProfile.id;
      isNewUser = !existingProfile.display_name; // belum onboarding
    } else {
      // Create auth user via admin API
      // Pakai email format khusus karena Supabase Auth perlu email/password
      // atau magic link. Untuk demo, kita pakai email pseudo dari phone.
      const pseudoEmail = `${phoneNumber.replace(/\D/g, '')}@carbonlink.demo`;
      const pseudoPassword = `demo-${phoneNumber}-${Date.now()}`;

      const { data: authData, error: createError } =
        await adminSupabase.auth.admin.createUser({
          email: pseudoEmail,
          password: pseudoPassword,
          email_confirm: true,
          user_metadata: { phone_number: phoneNumber },
        });

      if (createError || !authData.user) {
        console.error('Create user error:', createError);
        return {
          success: false,
          error: 'Gagal membuat akun: ' + (createError?.message || 'unknown'),
        };
      }

      userId = authData.user.id;
      isNewUser = true;

      // Create entry di public.users — incomplete profile (display_name null)
      const { error: profileError } = await adminSupabase
        .from('users')
        .insert({
          id: userId,
          phone_number: phoneNumber,
          display_name: '', // empty — akan diisi di onboarding
          province: null,
          regency: null,
        });

      if (profileError) {
        console.error('Profile insert error:', profileError);
        // Tidak fatal — user bisa lanjut ke onboarding untuk fill in
      }

      // Sign in pakai password yang barusan dibuat
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: pseudoEmail,
        password: pseudoPassword,
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        return {
          success: false,
          error: 'Akun dibuat tapi gagal login. Coba lagi.',
        };
      }

      return { success: true, isNewUser: true };
    }

    // Existing user — sign in
    // Untuk demo, kita pakai magic link approach (lebih simple daripada simpan password)
    // Tapi karena ini demo + service role, pakai signInWithPassword dengan reset:
    const pseudoEmail = `${phoneNumber.replace(/\D/g, '')}@carbonlink.demo`;
    const newPassword = `demo-${phoneNumber}-${Date.now()}`;

    // Update password ke yang baru lewat admin API
    await adminSupabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: pseudoEmail,
      password: newPassword,
    });

    if (signInError) {
      console.error('Sign in error (existing):', signInError);
      return {
        success: false,
        error: 'Gagal sign in: ' + signInError.message,
      };
    }

    return { success: true, isNewUser };
  } catch (err) {
    console.error('Verify OTP error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Terjadi kesalahan',
    };
  }
}

/**
 * Sign out current user.
 */
export async function signOutAction() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
}