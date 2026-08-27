import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if ('rating' in body) {
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'rating must be an integer from 1 to 5' }, { status: 422 });
    }
    updates.rating = rating;
  }
  if ('title' in body) updates.title = String(body.title ?? '').trim().slice(0, 120) || null;
  if ('body' in body) updates.body = String(body.body ?? '').trim().slice(0, 3000) || null;

  const { data, error } = await supabase
    .from('reviews')
    .update(updates)
    .eq('id', id)
    .eq('reviewer_id', user.id)
    .select('*')
    .single();

  if (error || !data) return NextResponse.json({ error: 'Review not found or update failed' }, { status: 404 });
  return NextResponse.json({ review: data });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const { error } = await supabase.from('reviews').delete().eq('id', id).eq('reviewer_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ deleted: true });
}
