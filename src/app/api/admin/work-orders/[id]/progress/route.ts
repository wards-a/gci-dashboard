import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";
import { mapPrismaError } from "@/lib/api/errors";

type Params = Promise<{ id: string }>;

// GET
export async function GET(_req: Request, { params }: { params: Params }) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [wo, logs] = await Promise.all([
    prisma.workOrder.findUnique({
      where: { id },
      select: { id: true, code: true, qtyPlanned: true, status: true },
    }),
    prisma.workProgress.findMany({
      where: { workOrderId: id },
      orderBy: [{ workDate: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  if (!wo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const totals = logs.reduce((acc: any, l) => {
    acc[l.stage] = (acc[l.stage] || 0) + l.qty;
    return acc;
  }, {});

  const costTotals = logs.reduce((acc: any, l: any) => {
    acc.total = (acc.total || 0) + (l.amount || 0);
    acc.byStage = acc.byStage || {};
    acc.byCat = acc.byCat || {};
    acc.byStage[l.stage] = (acc.byStage[l.stage] || 0) + (l.amount || 0);
    acc.byCat[l.category] = (acc.byCat[l.category] || 0) + (l.amount || 0);
    return acc;
  }, {});

  return NextResponse.json({ wo, totals, logs, costTotals });
}

// POST
const Body = z.object({
  stage: z.enum(["CUTTING", "BRANDING", "SEWING", "REWORK", "REJECT"]),
  category: z
    .enum([
      "LINE_IN_HOUSE",
      "BORONGAN_IN_HOUSE",
      "BORONGAN_OUT_HOUSE",
      "CMT_VENDOR",
    ])
    .default("LINE_IN_HOUSE"),
  qty: z.coerce.number().int().min(1),
  unitCost: z.coerce.number().int().min(0).optional(),
  extraCost: z.coerce.number().int().min(0).optional(),
  currency: z.enum(["IDR", "USD"]).default("IDR"),
  partnerId: z.string().cuid().optional(),
  note: z.string().optional(),
  workDate: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Params }) {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = Body.parse(await req.json());
    const needCost = body.category !== "LINE_IN_HOUSE";

    if (needCost && (body.unitCost == null || isNaN(body.unitCost))) {
      return NextResponse.json(
        { error: "unitCost wajib untuk kategori non-Line In House" },
        { status: 400 }
      );
    }

    if (
      (body.category === "BORONGAN_OUT_HOUSE" ||
        body.category === "CMT_VENDOR") &&
      !body.partnerId
    ) {
      return NextResponse.json(
        { error: "partner wajib untuk Out House / CMT" },
        { status: 400 }
      );
    }

    const { id } = await params;
    const wo = await prisma.workOrder.findUnique({
      where: { id: id },
      select: { id: true, code: true, qtyPlanned: true, status: true },
    });

    if (!wo)
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 }
      );

    // totals untuk validasi urutan
    const totalsAgg = await prisma.workProgress.groupBy({
      by: ["stage"],
      _sum: { qty: true },
      where: { workOrderId: wo.id },
    });

    const totals = Object.fromEntries(
      totalsAgg.map((a) => [a.stage, a._sum.qty || 0])
    ) as Record<string, number>;

    if (["CUTTING", "BRANDING", "SEWING"].includes(body.stage)) {
      const current = totals[body.stage] || 0;
      if (current + body.qty > wo.qtyPlanned) {
        return NextResponse.json(
          {
            error: `Qty melebihi planned WO (${current + body.qty} > ${
              wo.qtyPlanned
            })`,
          },
          { status: 400 }
        );
      }
    }

    const nextTotals = { ...totals };
    nextTotals[body.stage] =
      (nextTotals[body.stage] || 0) +
      (["REWORK", "REJECT"].includes(body.stage) ? 0 : body.qty);
    // const cut = nextTotals["CUTTING"] || 0,
    //   brand = nextTotals["BRANDING"] || 0,
    //   sew = nextTotals["SEWING"] || 0;
    // if (brand > cut)
    //   return NextResponse.json(
    //     { error: `BRANDING (${brand}) > CUTTING (${cut})` },
    //     { status: 400 }
    //   );
    // if (sew > brand)
    //   return NextResponse.json(
    //     { error: `SEWING (${sew}) > BRANDING (${brand})` },
    //     { status: 400 }
    //   );

    const amount =
      (needCost ? body.qty * (body.unitCost || 0) : 0) + (body.extraCost || 0);

    const log = await prisma.workProgress.create({
      data: {
        workOrderId: wo.id,
        stage: body.stage as any,
        category: body.category as any,
        qty: body.qty,
        note: body.note ?? undefined,
        recordedBy: session.user?.email || "admin",
        workDate: body.workDate ? new Date(body.workDate) : new Date(),
        currency: body.currency as any,
        unitCost: needCost ? body.unitCost || 0 : null,
        extraCost: body.extraCost ?? null,
        amount,
        partnerId: body.partnerId ?? null,
        payable: needCost,
      },
    });

    // auto status
    let newStatus = wo.status;
    if (wo.status === "PLANNED") newStatus = "IN_PROGRESS";
    if ((nextTotals["SEWING"] || 0) >= wo.qtyPlanned) newStatus = "DONE";
    if (newStatus !== wo.status) {
      await prisma.workOrder.update({
        where: { id: wo.id },
        data: { status: newStatus as any },
      });
    }

    return NextResponse.json({ ok: true, log });
  } catch (e: any) {
    if (e?.name === "ZodError")
      return NextResponse.json(
        { error: "Validasi gagal", details: e.errors },
        { status: 400 }
      );
    console.error("WO progress error:", e);

    return mapPrismaError(e);
  }
}
