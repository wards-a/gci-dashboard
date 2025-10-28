import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";
import { mapPrismaError } from "@/lib/api/errors";

export async function GET(req: Request) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || undefined;
  const status = searchParams.get("status") || undefined;
  const poId = searchParams.get("poId") || undefined;

  const where: any = {};
  if (q) where.code = { contains: q, mode: "insensitive" };
  if (status) where.status = status;
  if (poId) where.preOrderId = poId;

  const data = await prisma.workOrder.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    include: { preOrder: { select: { id: true, code: true } } },
  });
  return NextResponse.json({ data });
}

const Body = z.object({
  code: z.string().min(3),
  preOrderId: z.string().cuid().optional().nullable(),
  qtyPlanned: z.coerce.number().int().min(1),
  dueDate: z.string().datetime().optional().nullable(),
  note: z.string().optional().nullable(),
  status: z
    .enum(["PLANNED", "IN_PROGRESS", "DONE", "CANCELED"])
    .default("PLANNED"),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = Body.parse(await req.json());
    const wo = await prisma.workOrder.create({
      data: {
        code: body.code,
        preOrderId: body.preOrderId ?? undefined,
        qtyPlanned: body.qtyPlanned,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        note: body.note ?? undefined,
        status: body.status,
      },
    });
    return NextResponse.json({ ok: true, id: wo.id });
  } catch (e: any) {
    if (e?.name === "ZodError")
      return NextResponse.json(
        { error: "Validasi gagal", details: e.errors },
        { status: 400 }
      );
    return mapPrismaError(e);
  }
}
