import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendTelegramNotification } from '../../../../lib/telegram';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sensorId, token, value } = body;

    if (!sensorId || !token || value === undefined) {
      return NextResponse.json({ error: "Missing required fields: sensorId, token, value" }, { status: 400 });
    }

    // Authenticate device
    const sensor = await prisma.sensor.findUnique({ where: { id: sensorId } });
    if (!sensor || sensor.secretToken !== token) {
      return NextResponse.json({ error: "Unauthorized. Invalid sensorId or token." }, { status: 401 });
    }

    // Save Telemetry and update Sensor
    await prisma.$transaction([
      prisma.telemetry.create({
        data: { sensorId: sensor.id, value: Number(value) }
      }),
      prisma.sensor.update({
        where: { id: sensor.id },
        data: { value: Number(value), lastSeen: new Date() }
      })
    ]);

    // Check Thresholds and send Alerts
    const user = await prisma.user.findFirst();
    if (user) {
      let alertMsg = null;
      if (sensor.type === 'O2' && value < user.minO2Threshold) {
        alertMsg = `Критическое падение кислорода (${value} мг/л) на датчике ${sensor.id}. Порог: ${user.minO2Threshold}`;
      } else if (sensor.type === 'TEMP' && value < user.minTempThreshold) {
        alertMsg = `Температура ниже нормы (${value}°C) на датчике ${sensor.id}. Порог: ${user.minTempThreshold}`;
      } else if (sensor.type === 'TEMP' && value > user.maxTempThreshold) {
        alertMsg = `Превышение температуры (${value}°C) на датчике ${sensor.id}. Порог: ${user.maxTempThreshold}`;
      }

      if (alertMsg) {
        // Debounce or create alert (to prevent spamming, we could check last alert, but for demo just create it)
        await prisma.alert.create({
          data: {
            message: alertMsg,
            severity: 'CRITICAL'
          }
        });
        await sendTelegramNotification(alertMsg);
      }
    }

    return NextResponse.json({ success: true, message: "Data ingested successfully." });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
