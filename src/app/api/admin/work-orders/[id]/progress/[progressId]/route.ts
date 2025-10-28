import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { mapPrismaError } from "@/lib/api/errors";

type Params = Promise<{ progressId: string }>;

export async function DELETE(_req: Request, { params }: { params: Params }) {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // Ambil log & WO untuk recalculation
    const { progressId } = await params;
    const log = await prisma.workProgress.findUnique({
      where: { id: progressId },
    });
    if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.workProgress.delete({ where: { id: log.id } });

    // Recalculate status WO (simple): jika tidak ada log → PLANNED; jika ada & sewn < planned → IN_PROGRESS; jika sewn ≥ planned → DONE
    const [wo, totalsAgg] = await Promise.all([
      prisma.workOrder.findUnique({
        where: { id: log.workOrderId },
        select: { id: true, qtyPlanned: true, status: true },
      }),
      prisma.workProgress.groupBy({
        by: ["stage"],
        _sum: { qty: true },
        where: { workOrderId: log.workOrderId },
      }),
    ]);
    if (wo) {
      const totals = Object.fromEntries(
        totalsAgg.map((a) => [a.stage, a._sum.qty || 0])
      ) as Record<string, number>;
      const sewn = totals["SEWING"] || 0;
      let status = "PLANNED";
      if (sewn > 0) status = "IN_PROGRESS";
      if (sewn >= (wo.qtyPlanned || 0)) status = "DONE";
      if (status !== wo.status) {
        await prisma.workOrder.update({
          where: { id: wo.id },
          data: { status: status as any },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Delete WO progress error:", e);
    return mapPrismaError(e);
  }
}
