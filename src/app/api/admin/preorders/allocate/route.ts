import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { mapPrismaError } from "@/lib/api/errors";

const Body = z.object({
  preOrderItemId: z.string().cuid(),
  workOrderId: z.string().cuid(),
  qty: z.coerce.number().int().min(1),
  note: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = Body.parse(await req.json());

    const [item, wo, woAllocAgg] = await Promise.all([
      prisma.preOrderItem.findUnique({
        where: { id: body.preOrderItemId },
        select: {
          id: true,
          qtyOrdered: true,
          qtyAllocated: true,
          preOrderId: true,
        },
      }),
      prisma.workOrder.findUnique({
        where: { id: body.workOrderId },
        select: { id: true, code: true, qtyPlanned: true, status: true },
      }),
      prisma.allocation.aggregate({
        _sum: { qty: true },
        where: { workOrderId: body.workOrderId },
      }),
    ]);

    if (!item)
      return NextResponse.json({ error: "PO item not found" }, { status: 404 });
    if (!wo)
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 }
      );
    if (["DONE", "CANCELED"].includes(wo.status as any))
      return NextResponse.json(
        { error: "Work order is not allocatable" },
        { status: 400 }
      );

    const poRemaining = Math.max(0, item.qtyOrdered - item.qtyAllocated);
    if (body.qty > poRemaining)
      return NextResponse.json(
        { error: `Qty exceeds PO remaining (${body.qty} > ${poRemaining})` },
        { status: 400 }
      );

    const woAllocated = woAllocAgg._sum.qty || 0;
    const woRemaining = Math.max(0, wo.qtyPlanned - woAllocated);
    if (body.qty > woRemaining)
      return NextResponse.json(
        { error: `Qty exceeds WO remaining (${body.qty} > ${woRemaining})` },
        { status: 400 }
      );

    await prisma.$transaction(async (tx) => {
      await tx.allocation.create({
        data: { preOrderItemId: item.id, workOrderId: wo.id, qty: body.qty },
      });
      await tx.preOrderItem.update({
        where: { id: item.id },
        data: { qtyAllocated: { increment: body.qty } },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return NextResponse.json(
        { error: "Validasi gagal", details: e.errors },
        { status: 400 }
      );
    }
    console.error("Allocate error:", e);
    return mapPrismaError(e);
  }
}
