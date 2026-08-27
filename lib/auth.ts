import { createSupabaseServerClient } from './supabase/server';

export async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { supabase, user: null };

  await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email ?? null,
    full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
  }, { onConflict: 'id' });

  return { supabase, user };
}
