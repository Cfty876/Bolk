import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const forecasts = await prisma.aiForecast.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(forecasts);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Не удалось получить прогнозы' }, { status: 500 });
  }
}
