import { NextResponse } from 'next/server';
import { resolveAlert } from '../../../../actions';

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await resolveAlert(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Alert Resolve Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
