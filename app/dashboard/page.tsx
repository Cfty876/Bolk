import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import EmptyDashboard from './EmptyDashboard';
import { getCages, getTodayTasks, getFCRData, getUserSettings } from '../actions';

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session || !session.user?.email) {
    redirect('/login');
  }

  const settings = await getUserSettings(session.user.email);
  const userName = settings?.name || session.user?.name || 'Пользователь';

  const cages = await getCages();
  const tasks = await getTodayTasks();
  const fcr = await getFCRData();

  return <EmptyDashboard userName={userName} cages={cages} tasks={tasks} averageFCR={fcr} />;
}
