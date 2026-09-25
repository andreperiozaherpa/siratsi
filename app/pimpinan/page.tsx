import { redirect } from 'next/navigation';
import { currentAccess } from '../access';
import LeadershipDashboard from './dashboard';

export const dynamic = 'force-dynamic';
export default async function LeadershipPage() {
  const session = await currentAccess();
  if (!session.access || !['leader_approver', 'super_admin'].includes(session.access.role)) redirect('/');
  return <LeadershipDashboard />;
}
