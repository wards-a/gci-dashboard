import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const Row = z.object({
  woOperationId: z.string().cuid(),
  date: z.string().datetime(),
  shift: z.string().optional(),
  qtyGood: z.number().int().min(0),
  qtyReject: z.number().int().min(0),
  note: z.string().optional(),
  defects: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  const rows = z.array(Row).parse(await req.json());

  await prisma.$transaction(async (tx) => {
    for (const r of rows) {
      const op = await tx.woOperation.findUnique({
        where: { id: r.woOperationId },
        include: { wo: true },
      });
      if (!op) throw new Error("Operation not found");

      const agg = await tx.productionEntry.aggregate({
        _sum: { qtyGood: true, qtyReject: true },
        where: { woOperationId: r.woOperationId },
      });
      const current = (agg._sum.qtyGood ?? 0) + (agg._sum.qtyReject ?? 0);
      const incoming = r.qtyGood + r.qtyReject;
      if (current + incoming > op.wo.qtyPlanned)
        throw new Error("Exceeds planned qty");

      await tx.productionEntry.create({
        data: {
          woOperationId: r.woOperationId,
          date: new Date(r.date),
          shift: r.shift,
          qtyGood: r.qtyGood,
          qtyReject: r.qtyReject,
          note: r.note,
          defects: r.defects ? JSON.stringify(r.defects) : undefined,
          actorId: "admin", // TODO: ambil dari session
        },
      });

      // Mirror ringkasan ke WoOperation
      const sum = await tx.productionEntry.aggregate({
        _sum: { qtyGood: true, qtyReject: true },
        where: { woOperationId: r.woOperationId },
      });
      await tx.woOperation.update({
        where: { id: r.woOperationId },
        data: {
          qtyGood: sum._sum.qtyGood ?? 0,
          qtyReject: sum._sum.qtyReject ?? 0,
        },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
