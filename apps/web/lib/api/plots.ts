import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { IDR_PER_TCO2E } from '@worklifebalance/types';
import type { PlotWithDetails, User } from '@worklifebalance/types';

/**
 * Fetch current authenticated user's profile dari database.
 */
export async function getCurrentUserProfile(): Promise<User | null> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  return data;
}

/**
 * Fetch semua plot milik current user (sebagai account holder),
 * dengan detail land_owner, verification, dan carbon_estimate.
 */
export async function getUserPlots(): Promise<PlotWithDetails[]> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('plots')
    .select(
      `
      *,
      land_owner:land_owners(*),
      verification:verifications(*),
      carbon_estimate:carbon_estimates(*),
      photos:plot_photos(*)
      `
    )
    .eq('account_holder_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching plots:', error);
    return [];
  }

  // Calculate annual_earnings_idr derived field
  return (data || []).map((p: any) => {
    const annualTco2e = p.carbon_estimate?.annual_sequestration_tco2e || 0;
    return {
      ...p,
      verification: Array.isArray(p.verification)
        ? p.verification[0] || null
        : p.verification,
      carbon_estimate: Array.isArray(p.carbon_estimate)
        ? p.carbon_estimate[0] || null
        : p.carbon_estimate,
      annual_earnings_idr: Math.round(annualTco2e * IDR_PER_TCO2E),
    } as PlotWithDetails;
  });
}

/**
 * Fetch user balance — total saldo tersedia untuk withdrawal.
 * Dihitung dari sum credit_sold transactions dikurangi withdrawal.
 */
export async function getUserBalance(): Promise<number> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const { data, error } = await supabase
    .from('transactions')
    .select('transaction_type, amount_idr, status')
    .eq('user_id', user.id)
    .eq('status', 'completed');

  if (error) {
    console.error('Error fetching balance:', error);
    return 0;
  }

  return (data || []).reduce((sum, tx: any) => {
    if (tx.transaction_type === 'credit_sold') return sum + tx.amount_idr;
    if (tx.transaction_type === 'withdrawal') return sum - tx.amount_idr;
    return sum;
  }, 0);
}

/**
 * Fetch single plot by ID — untuk plot detail page.
 */
export async function getPlotById(
  plotId: string
): Promise<PlotWithDetails | null> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('plots')
    .select(
      `
      *,
      land_owner:land_owners(*),
      verification:verifications(*),
      carbon_estimate:carbon_estimates(*),
      photos:plot_photos(*)
      `
    )
    .eq('id', plotId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error('Error fetching plot:', error);
    return null;
  }

  const annualTco2e = (data as any).carbon_estimate?.annual_sequestration_tco2e || 0;
  return {
    ...(data as any),
    verification: Array.isArray((data as any).verification)
      ? (data as any).verification[0] || null
      : (data as any).verification,
    carbon_estimate: Array.isArray((data as any).carbon_estimate)
      ? (data as any).carbon_estimate[0] || null
      : (data as any).carbon_estimate,
    annual_earnings_idr: Math.round(annualTco2e * IDR_PER_TCO2E),
  } as PlotWithDetails;
}