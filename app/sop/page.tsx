import { redirect } from 'next/navigation';
import { currentAccess } from '../access';
import SopRepository from './repository';

export const dynamic = 'force-dynamic';
export default async function SopPage() {
  const session = await currentAccess();
  if (!session.access) redirect('/');
  return <SopRepository canManage={session.access.role === 'super_admin'} />;
}
