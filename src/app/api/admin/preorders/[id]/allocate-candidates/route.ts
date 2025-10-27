import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("item");
  const q = (searchParams.get("q") || "").trim();
  if (!itemId)
    return NextResponse.json({ error: "Missing item" }, { status: 400 });

  const { id } = await params;
  const item = await prisma.preOrderItem.findFirst({
    where: { id: itemId, preOrderId: id },
    select: {
      id: true,
      title: true,
      qtyOrdered: true,
      qtyAllocated: true,
      preOrder: { select: { id: true, code: true, promisedShip: true } },
      size: true,
      color: true,
    },
  });
  if (!item)
    return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const poRemaining = Math.max(0, item.qtyOrdered - item.qtyAllocated);

  // Ambil WO kandidat
  const wos = await prisma.workOrder.findMany({
    where: {
      status: { notIn: ["DONE", "CANCELED"] },
      ...(q ? { OR: [{ code: { contains: q, mode: "insensitive" } }] } : {}),
    },
    select: {
      id: true,
      code: true,
      qtyPlanned: true,
      dueDate: true,
      status: true,
    },
    orderBy: [{ dueDate: "asc" }, { code: "asc" }],
    take: 100,
  });

  // Hitung total alokasi yang sudah ada per WO
  const woIds = wos.map((w) => w.id);
  const allocAgg = await prisma.allocation.groupBy({
    by: ["workOrderId"],
    _sum: { qty: true },
    where: { workOrderId: { in: woIds } },
  });
  const allocMap = Object.fromEntries(
    allocAgg.map((a) => [a.workOrderId, a._sum.qty || 0])
  ) as Record<string, number>;

  const candidates = wos
    .map((w) => {
      const allocated = allocMap[w.id] || 0;
      const woRemaining = Math.max(0, w.qtyPlanned - allocated);
      return {
        id: w.id,
        code: w.code,
        status: w.status,
        qtyPlanned: w.qtyPlanned,
        allocated,
        woRemaining,
        dueDate: w.dueDate,
      };
    })
    .filter((c) => c.woRemaining > 0);

  return NextResponse.json({
    item: {
      id: item.id,
      title: item.title,
      size: item.size,
      color: item.color,
      qtyOrdered: item.qtyOrdered,
      qtyAllocated: item.qtyAllocated,
      poRemaining,
      po: {
        id: item.preOrder.id,
        code: item.preOrder.code,
        promisedShip: item.preOrder.promisedShip,
      },
    },
    candidates,
  });
}
