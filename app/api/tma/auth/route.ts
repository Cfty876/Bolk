import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { telegramId } = await req.json();

    if (!telegramId) {
      return NextResponse.json({ error: "Отсутствует Telegram ID" }, { status: 400 });
    }

    const tIdString = telegramId.toString();

    const employee = await prisma.employee.findUnique({
      where: { telegramId: tIdString },
      include: { user: true }
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: "Доступ запрещен. Зарегистрируйтесь через бота по токену." });
    }

    // Если у сотрудника нет привязанного пользователя (старые записи), используем первого пользователя в системе как фоллбек
    let userPermissions = employee.user;
    if (!userPermissions) {
      userPermissions = await prisma.user.findFirst();
    }

    const authorizedEmployee = {
      ...employee,
      canViewJournal: userPermissions?.tmaAllowJournals ?? true,
      canViewCages: userPermissions?.tmaAllowCages ?? true,
      canViewSchedule: userPermissions?.tmaAllowSchedule ?? true
    };

    return NextResponse.json({ success: true, employee: authorizedEmployee });
  } catch (error) {
    console.error("TMA Auth Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
