import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const { user } = await requireUser();
  if (!user) redirect('/login');
  return <DashboardClient />;
}
