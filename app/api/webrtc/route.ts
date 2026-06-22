import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const room = await prisma.videoRoom.findUnique({ where: { code } });
  return NextResponse.json(room || { error: "Room not found" });
}

export async function POST(req: Request) {
  try {
    const { action, code, offer, answer } = await req.json();

    if (action === 'create') {
      await prisma.videoRoom.upsert({
        where: { code },
        update: { offer: null, answer: null, createdAt: new Date() },
        create: { code, offer: null, answer: null }
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'offer') {
      await prisma.videoRoom.update({
        where: { code },
        data: { offer }
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'answer') {
      await prisma.videoRoom.update({
        where: { code },
        data: { answer }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
