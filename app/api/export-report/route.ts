import { NextResponse } from 'next/server';

export async function GET() {
  const csvData = `Date,Cage,Fish Type,Status,O2 (mg/l),Temp (C)
2026-06-19,Садок #1,Форель,GOOD,8.2,14.5
2026-06-19,Садок #2,Осетр,WARNING,7.5,15.5
`;

  return new NextResponse(csvData, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="vetlog-report.csv"'
    }
  });
}
