'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { AddLahanFormState, OwnershipType } from '@karbonkredit/types';

interface SubmitResult {
  success: boolean;
  plotId?: string;
  error?: string;
}

/**
 * Submit hasil wizard ke database.
 * Operations dilakukan dalam urutan dengan rollback awareness:
 *   1. Upsert user_identities (kalau belum ada)
 *   2. Get-or-create land_owners
 *   3. Insert plot
 *   4. Insert plot_documents
 *   5. Insert plot_photos
 *
 * Catatan: Supabase client tidak punya transaction support native.
 * Untuk MVP, kita accept eventual consistency. Production butuh
 * stored procedure atau Edge Function untuk atomicity.
 */
export async function submitPlotAction(
  form: AddLahanFormState
): Promise<SubmitResult> {
  const supabase = createSupabaseServerClient();

  // Auth check
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { success: false, error: 'Tidak terautentikasi' };
  }

  // Validation
  if (!form.ownership) {
    return { success: false, error: 'Kepemilikan belum dipilih' };
  }
  if (!form.plot_name || !form.polygon_geojson || !form.area_hectares) {
    return { success: false, error: 'Data lahan tidak lengkap' };
  }
  if (form.ownership === 'on_behalf' && !form.consent_acknowledged) {
    return { success: false, error: 'Konsen hukum belum disetujui' };
  }

  try {
    // ─── Step 1: Upsert user_identities (kalau belum ada) ───
    const { error: identityError } = await supabase
      .from('user_identities')
      .upsert(
        {
          user_id: authUser.id,
          full_name: form.registrant_full_name,
          nik: form.registrant_nik,
          ktp_photo_url: form.registrant_ktp_photo_url || null,
          verified_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (identityError) {
      console.error('Identity upsert error:', identityError);
      return { success: false, error: 'Gagal menyimpan data diri' };
    }

    // ─── Step 2: Resolve land_owner_id ───
    let landOwnerId: string;

    if (form.ownership === 'self') {
      // Branch A: Land owner = registrant. Get or create record dengan NIK registrant.
      landOwnerId = await getOrCreateLandOwner(supabase, {
        full_name: form.registrant_full_name,
        nik: form.registrant_nik,
        ktp_photo_url: form.registrant_ktp_photo_url || null,
        phone_number: null, // self ownership: pakai phone account holder
        created_by_user_id: authUser.id,
      });
    } else {
      // Branch B: Different land owner
      if (!form.owner_full_name || !form.owner_nik) {
        return { success: false, error: 'Data pemilik lahan tidak lengkap' };
      }
      landOwnerId = await getOrCreateLandOwner(supabase, {
        full_name: form.owner_full_name,
        nik: form.owner_nik,
        ktp_photo_url: form.owner_ktp_photo_url || null,
        phone_number: form.owner_phone_number || null,
        created_by_user_id: authUser.id,
      });
    }

    // ─── Step 3: Insert plot ───
    const { data: plot, error: plotError } = await supabase
      .from('plots')
      .insert({
        account_holder_id: authUser.id,
        land_owner_id: landOwnerId,
        name: form.plot_name,
        polygon_geojson: form.polygon_geojson,
        area_hectares: form.area_hectares,
        address: form.address,
        land_type: form.land_type,
        managed_since_year: form.managed_since_year,
        dominant_tree_types: form.dominant_tree_types,
        estimated_tree_count: form.estimated_tree_count || null,
        ownership_type: form.ownership,
        consent_acknowledged: form.consent_acknowledged,
        status: 'pending',
      })
      .select('id')
      .single();

    if (plotError || !plot) {
      console.error('Plot insert error:', plotError);
      return {
        success: false,
        error: plotError?.message || 'Gagal menyimpan data lahan',
      };
    }

    const plotId = plot.id;

    // ─── Step 4: Insert legal documents (parallel) ───
    if (form.legal_documents.length > 0) {
      const { error: docError } = await supabase.from('plot_documents').insert(
        form.legal_documents.map((d) => ({
          plot_id: plotId,
          document_type: d.type,
          file_url: d.url,
        }))
      );
      if (docError) {
        console.error('Document insert error (non-fatal):', docError);
        // Non-fatal: plot sudah saved, document bisa di-retry nanti
      }
    }

    // ─── Step 5: Insert photos ───
    if (form.photos.length > 0) {
      const { error: photoError } = await supabase.from('plot_photos').insert(
        form.photos.map((url) => ({
          plot_id: plotId,
          file_url: url,
          ai_analysis_result: null, // diisi nanti oleh verification pipeline
        }))
      );
      if (photoError) {
        console.error('Photo insert error:', photoError);
        return {
          success: false,
          error: 'Plot tersimpan, tapi foto gagal di-upload. Silakan upload ulang.',
        };
      }
    }

    // Trigger revalidation untuk homepage
    revalidatePath('/home');

    return { success: true, plotId };
  } catch (err) {
    console.error('Submit plot error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

interface LandOwnerInput {
  full_name: string;
  nik: string;
  ktp_photo_url: string | null;
  phone_number: string | null;
  created_by_user_id: string;
}

/**
 * Get-or-create land owner berdasarkan NIK (unique).
 * Kalau NIK sudah ada di database, return ID-nya. Kalau belum, create baru.
 *
 * Pattern ini penting karena satu pemilik lahan bisa punya banyak plot —
 * kita tidak ingin duplicate land_owner record per plot.
 */
async function getOrCreateLandOwner(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  input: LandOwnerInput
): Promise<string> {
  // Check existing by NIK
  const { data: existing } = await supabase
    .from('land_owners')
    .select('id')
    .eq('nik', input.nik)
    .maybeSingle();

  if (existing?.id) return existing.id;

  // Create new
  const { data: newOwner, error } = await supabase
    .from('land_owners')
    .insert(input)
    .select('id')
    .single();

  if (error || !newOwner) {
    throw new Error(error?.message || 'Gagal create land owner');
  }
  return newOwner.id;
}