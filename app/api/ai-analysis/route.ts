import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { data, fishType } = await req.json();

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "VetLog Aqua"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          {
            role: "system",
            content: `Ты — ИИ-аналитик аквафермы. Дай прогноз рисков для рыбы (${fishType || 'Неизвестная'}). 
Отвечай СТРОГО в формате JSON без маркдауна и лишних слов:
{
  "status": "OK" или "WARNING" или "CRITICAL",
  "text": "Краткий прогноз рисков (2 предложения)",
  "recommendation": "Что нужно сделать прямо сейчас (1 предложение)"
}`
          },
          {
            role: "user",
            content: `Показатели воды: ${JSON.stringify(data)}.`
          }
        ]
      })
    });

    const result = await response.json();
    let textContent = result.choices[0].message.content;
    
    textContent = textContent.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(textContent);

    const savedForecast = await prisma.aiForecast.create({
      data: {
        status: parsed.status,
        text: parsed.text,
        recommendation: parsed.recommendation
      }
    });

    return NextResponse.json(savedForecast);
  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ 
        status: "ERROR",
        text: "Не удалось получить прогноз ИИ. Модель перегружена.",
        recommendation: "Попробуйте позже." 
    }, { status: 500 });
  }
}
