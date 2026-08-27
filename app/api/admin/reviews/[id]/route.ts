import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const statuses = new Set(['published', 'hidden', 'flagged']);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { user, isAdmin } = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json();
  const status = String(body.status ?? '').trim();
  if (!statuses.has(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 422 });

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('reviews')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

  await admin.from('audit_logs').insert({
    actor_id: user.id,
    action: 'review_moderated',
    entity_type: 'review',
    entity_id: id,
    metadata: { status },
  });

  return NextResponse.json({ review: data });
}
