'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface SaveProfileInput {
  display_name: string;
  province: string;
  regency: string;
}

interface SaveProfileResult {
  success: boolean;
  error?: string;
}

export async function saveProfileAction(
  input: SaveProfileInput
): Promise<SaveProfileResult> {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Tidak terautentikasi' };
  }

  if (!input.display_name || input.display_name.length < 2) {
    return { success: false, error: 'Nama panggilan terlalu pendek' };
  }
  if (!input.province || !input.regency) {
    return { success: false, error: 'Provinsi dan kabupaten wajib diisi' };
  }

  const { error } = await supabase
    .from('users')
    .update({
      display_name: input.display_name,
      province: input.province,
      regency: input.regency,
    })
    .eq('id', user.id);

  if (error) {
    console.error('Save profile error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/home');
  return { success: true };
}