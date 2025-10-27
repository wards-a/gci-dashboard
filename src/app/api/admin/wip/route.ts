import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ambil WO yang belum DONE, beserta operasi dan mirror qty
  const wos = await prisma.workOrder.findMany({
    where: { status: { notIn: ["DONE", "CANCELED"] } },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    take: 20,
    include: {
      productVar: { include: { product: true } },
      operations: {
        include: { operation: { include: { workCenter: true } } },
        orderBy: { seq: "asc" },
      },
    },
  });
  const items = wos.flatMap((wo) =>
    wo.operations.map((op) => ({
      woId: wo.id,
      woCode: wo.code,
      product: wo.productVar.product.name,
      variant: wo.productVar.color ?? "",
      opId: op.id,
      opName: op.operation.name,
      wc: op.operation.workCenter.code,
      planned: wo.qtyPlanned,
      good: op.qtyGood,
      reject: op.qtyReject,
      remaining: Math.max(0, wo.qtyPlanned - (op.qtyGood + op.qtyReject)),
      status: op.status,
    }))
  );

  // Filter hanya baris yang masih ada sisa
  const wip = items.filter((x) => x.remaining > 0);

  return NextResponse.json({ wip });
}
