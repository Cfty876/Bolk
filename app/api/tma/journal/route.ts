import { NextResponse } from 'next/server';
import { createJournalEntry } from '../../../../actions';

export async function POST(req: Request) {
  try {
    const { title, description, type, cageId, foodType, amountKg, mortalityQty } = await req.json();

    if (!type || (type !== 'FEEDING' && !title) || !description) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const entry = await createJournalEntry(
      cageId || null,
      type,
      title || 'Кормление', // if FEEDING title is not required
      description,
      foodType,
      amountKg ? parseFloat(amountKg) : undefined,
      mortalityQty ? parseInt(mortalityQty) : undefined
    );

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error("TMA Journal Add Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
