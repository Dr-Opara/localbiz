import { requireUser } from '@/lib/auth';

export async function requireAdmin() {
  const { supabase, user } = await requireUser();
  if (!user) return { supabase, user: null, isAdmin: false };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return {
    supabase,
    user,
    isAdmin: profile?.role === 'admin',
  };
}
