import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getTodayTasks, getTasksForMonth } from '../../../actions';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function GET() {
  try {
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);

    let schedule = await getTasksForMonth(now.getFullYear(), now.getMonth() + 1);
    if (nextWeek.getMonth() !== now.getMonth()) {
      const nextMonth = await getTasksForMonth(nextWeek.getFullYear(), nextWeek.getMonth() + 1);
      schedule = [...schedule, ...nextMonth];
    }

    const [cages, journals, alerts, todayTasks, forecasts] = await Promise.all([
      prisma.cage.findMany({
        include: { 
          fishes: true, 
          sensors: {
            include: {
              telemetry: { orderBy: { createdAt: 'desc' }, take: 500 }
            }
          }
        }
      }),
      prisma.journalEntry.findMany({
        include: { cage: true },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      prisma.alert.findMany({
        where: { resolved: false },
        orderBy: { createdAt: 'desc' }
      }),
      getTodayTasks(),
      prisma.aiForecast.findMany({
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return NextResponse.json({ success: true, cages, journals, alerts, todayTasks, forecasts, monthSchedule: schedule });
  } catch (error) {
    console.error("TMA Data Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
