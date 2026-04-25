// apps/web/app/withdraw/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface WithdrawInput {
  amount_idr: number;
  method: string;
}

interface WithdrawResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export async function withdrawAction(
  input: WithdrawInput
): Promise<WithdrawResult> {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Tidak terautentikasi' };
  }

  if (input.amount_idr < 10_000) {
    return { success: false, error: 'Minimum penarikan Rp 10.000' };
  }

  // Generate mock transaction ID
  const trxId = `TRX-${new Date().getFullYear()}-${Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()}`;

  // Insert transaction record (mock — tidak ada real payment gateway call)
  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    plot_id: null,
    transaction_type: 'withdrawal',
    amount_idr: input.amount_idr,
    tco2e_amount: null,
    status: 'completed',
  });

  if (error) {
    console.error('Withdraw error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/home');
  return { success: true, transactionId: trxId };
}