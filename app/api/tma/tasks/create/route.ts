import { NextResponse } from 'next/server';
import { createTaskSchedule } from '../../../../actions';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      cageId, type, frequency, time,
      date, dayOfWeek,
      title, desc, foodType, amountKg
    } = body;

    if (!cageId || !type || !frequency || !time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const dayOfWeekParsed = dayOfWeek !== null && dayOfWeek !== undefined ? parseInt(dayOfWeek, 10) : null;
    const amountKgParsed = amountKg ? parseFloat(amountKg) : null;

    const result = await createTaskSchedule(
      cageId, type, frequency, time,
      date || null, dayOfWeekParsed,
      title || null, desc || null,
      foodType || null, amountKgParsed
    );

    return NextResponse.json({ success: true, scheduleId: result.id });
  } catch (error: any) {
    console.error("Task Schedule Create Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
