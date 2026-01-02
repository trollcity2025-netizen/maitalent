import { supabase } from './supabaseClient';

export type PayoutRequestRow = {
  id: string;
  user_id: string;
  week_id: string;
  rank_verified: number | null;
  status: 'pending' | 'issued' | 'delivered' | 'redeemed' | 'rejected';
  requested_at: string;
  processed_at: string | null;
  admin_id: string | null;
  provider: string | null;
  code: string | null;
  amount: number | null;
};

export type PayoutRequestResult = {
  data: PayoutRequestRow | null;
  error: Error | null;
};

export const requestGiftCardPayout = async (
  userId: string,
  weekId: string
): Promise<PayoutRequestResult> => {
  const { data: winner, error: winnerError } = await supabase
    .from('weekly_winners')
    .select('id, rank, reward_amount')
    .eq('user_id', userId)
    .eq('week_id', weekId)
    .lte('rank', 3)
    .single();

  if (winnerError || !winner) {
    return {
      data: null,
      error: new Error(
        'You are not eligible for payout. Only Top 3 weekly winners can request gift card payouts.'
      ),
    };
  }

  const { data: existing, error: existingError } = await supabase
    .from('payout_requests')
    .select('id, status')
    .eq('user_id', userId)
    .eq('week_id', weekId)
    .in('status', ['pending', 'issued', 'delivered'])
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return {
      data: null,
      error: new Error('You already have a payout request for this week.'),
    };
  }

  const { data, error } = await supabase
    .from('payout_requests')
    .insert([
      {
        user_id: userId,
        week_id: weekId,
        rank_verified: winner.rank,
        status: 'pending',
        requested_at: new Date().toISOString(),
        processed_at: null,
        admin_id: null,
        provider: null,
        code: null,
        amount: winner.reward_amount,
      },
    ])
    .select()
    .single();

  return { data: data as PayoutRequestRow | null, error: error as Error | null };
};

export const issueGiftCardPayout = async (
  payoutId: string,
  adminId: string,
  provider: string,
  code: string,
  amount: number
): Promise<PayoutRequestResult> => {
  const { data: payout, error: payoutError } = await supabase
    .from('payout_requests')
    .select('id, user_id, week_id, status')
    .eq('id', payoutId)
    .single();

  if (payoutError || !payout) {
    return { data: null, error: payoutError || new Error('Payout request not found') };
  }

  if (payout.status !== 'pending') {
    return { data: null, error: new Error('Payout is not in a pending state') };
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('payout_requests')
    .update({
      status: 'issued',
      processed_at: now,
      admin_id: adminId,
      provider,
      code,
      amount,
    })
    .eq('id', payoutId)
    .select()
    .single();

  if (error || !data) {
    return { data: null, error: error || new Error('Failed to update payout request') };
  }

  const transactionInsert = supabase.from('transactions').insert([
    {
      user_id: payout.user_id,
      type: 'payout',
      amount_coins: null,
      amount_usd: amount,
      details: `Gift card payout issued (${provider})`,
      related_user_id: adminId,
      week_id: payout.week_id,
      created_at: now,
    },
  ]);

  const { data: adminUser } = await supabase
    .from('users')
    .select('email, full_name')
    .eq('id', adminId)
    .single();

  const { data: recipientUser } = await supabase
    .from('users')
    .select('email, full_name')
    .eq('id', payout.user_id)
    .single();

  const fromEmail = adminUser?.email || '';
  const toEmail = recipientUser?.email || '';
  const fromName = adminUser?.full_name || 'Admin';
  const toName = recipientUser?.full_name || null;

  const messageInsert = supabase.entities.Message.create({
    from_email: fromEmail,
    to_email: toEmail,
    from_name: fromName,
    to_name: toName,
    message: `Your ${provider} gift card has been issued for $${amount.toFixed(
      2
    )}. Open your profile withdrawals to view the code.`,
    conversation_id: [fromEmail, toEmail].sort().join('-'),
    is_read: false,
  });

  const { error: transactionError } = await transactionInsert;
  if (transactionError) {
    return { data: null, error: transactionError as Error };
  }

  const auditInsert = supabase.from('payout_audit_log').insert([
    {
      payout_id: payout.id,
      admin_id: adminId,
      action: 'issued',
      metadata: {
        provider,
        amount,
      },
      created_at: now,
    },
  ]);

  await messageInsert;
  const { error: auditError } = await auditInsert;
  if (auditError) {
    return { data: null, error: auditError as Error };
  }

  return { data: data as PayoutRequestRow, error: null };
};
