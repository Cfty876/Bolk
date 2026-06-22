import { NextResponse } from 'next/server';
import { markTaskComplete } from '../../../actions';

export async function POST(req: Request) {
  try {
    const { scheduleId, mortalityQty, mortalityReason } = await req.json();

    if (!scheduleId) {
      return NextResponse.json({ error: "Missing scheduleId" }, { status: 400 });
    }

    await markTaskComplete(scheduleId, mortalityQty, mortalityReason);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Task Complete Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
