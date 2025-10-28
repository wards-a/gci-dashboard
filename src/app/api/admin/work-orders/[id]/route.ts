import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";
import { mapPrismaError } from "@/lib/api/errors";

type Params = Promise<{ id: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const wo = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      preOrder: { select: { id: true, code: true } },
      allocations: {
        include: { preOrderItem: { select: { id: true, title: true } } },
      },
    },
  });
  if (!wo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ wo });
}

const Body = z.object({
  code: z.string().min(3),
  preOrderId: z.string().cuid().optional().nullable(),
  qtyPlanned: z.coerce.number().int().min(1),
  dueDate: z.string().datetime().optional().nullable(),
  note: z.string().optional().nullable(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "DONE", "CANCELED"]),
});

export async function PUT(req: Request, { params }: { params: Params }) {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = Body.parse(await req.json());
    const { id } = await params;
    await prisma.workOrder.update({
      where: { id },
      data: {
        code: body.code,
        preOrderId: body.preOrderId ?? undefined,
        qtyPlanned: body.qtyPlanned,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        note: body.note ?? undefined,
        status: body.status,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.name === "ZodError")
      return NextResponse.json(
        { error: "Validasi gagal", details: e.errors },
        { status: 400 }
      );
    return mapPrismaError(e);
  }
}
