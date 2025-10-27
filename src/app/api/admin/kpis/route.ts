import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rentang "hari ini" (lokal server). Sesuaikan jika butuh TZ tertentu.
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  // 1) WO aktif (RELEASED/IN_PROGRESS)
  const activeWO = await prisma.workOrder.count({
    where: { status: { in: ["RELEASED", "IN_PROGRESS"] } },
  });

  // 2) Output hari ini (sum qtyGood) & reject hari ini (sum qtyReject)
  const todayAgg = await prisma.productionEntry.aggregate({
    _sum: { qtyGood: true, qtyReject: true },
    where: { date: { gte: start, lt: end } },
  });
  const todayGood = todayAgg._sum.qtyGood ?? 0;
  const todayReject = todayAgg._sum.qtyReject ?? 0;
  const todayTotal = todayGood + todayReject;
  const rejectRate = todayTotal
    ? +((todayReject / todayTotal) * 100).toFixed(1)
    : 0;

  // 3) Lead time rata2 per operasi (7 hari terakhir) — jam
  const seven = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const ops = await prisma.woOperation.findMany({
    where: {
      startedAt: { not: null },
      finishedAt: { not: null },
      //   finishedAt: { gte: seven },
    },
    select: { startedAt: true, finishedAt: true },
    take: 2000,
  });
  const durationsH = ops
    .map((o) => (o.finishedAt!.getTime() - o.startedAt!.getTime()) / 36e5)
    .filter((h) => isFinite(h) && h >= 0);
  const leadTimeAvgH = durationsH.length
    ? +(durationsH.reduce((a, b) => a + b, 0) / durationsH.length).toFixed(1)
    : 0;

  return NextResponse.json({
    activeWO,
    todayGood,
    rejectRate, // %
    leadTimeAvgH,
  });
}
