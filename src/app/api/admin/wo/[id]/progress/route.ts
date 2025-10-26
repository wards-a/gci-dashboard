import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const wo = await prisma.workOrder.findUnique({
    where: { id: params.id },
    include: {
      productVar: { include: { product: true } },
      operations: {
        include: { operation: { include: { workCenter: true } } },
        orderBy: { seq: "asc" },
      },
    },
  });
  if (!wo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // hitung sisa output per operasi (mirror sdh ada di WoOperation)
  const data = wo.operations.map((op) => ({
    id: op.id,
    seq: op.seq,
    name: op.operation.name,
    workCenter: op.operation.workCenter.code,
    planned: wo.qtyPlanned,
    good: op.qtyGood,
    reject: op.qtyReject,
    remaining: Math.max(0, wo.qtyPlanned - (op.qtyGood + op.qtyReject)),
    status: op.status,
  }));

  return NextResponse.json({
    wo: {
      id: wo.id,
      code: wo.code,
      product: wo.productVar.product.name,
      variant: wo.productVar.color ?? "",
    },
    operations: data,
  });
}
