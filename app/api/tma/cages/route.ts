import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { name, fishType, volumeM3, fishCount, avgWeightKg } = await req.json();

    if (!name || !fishType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newCage = await prisma.cage.create({
      data: {
        name,
        fishType,
        volumeM3: volumeM3 || 1000,
        fishCount: fishCount || 0,
        avgWeightKg: avgWeightKg || 0,
        sensors: {
          create: [
            { type: 'TEMP', status: 'ACTIVE', value: 12.5 },
            { type: 'O2', status: 'ACTIVE', value: 8.5 }
          ]
        }
      }
    });

    return NextResponse.json({ success: true, cage: newCage });
  } catch (error) {
    console.error("TMA Cages Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
