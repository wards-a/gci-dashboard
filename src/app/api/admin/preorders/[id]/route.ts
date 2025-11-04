import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";
import { ShipOption } from "@prisma/client";
import { mapPrismaError } from "@/lib/api/errors";
import { generateWoCode } from "@/lib/wo";

type Params = Promise<{ id: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const po = await prisma.preOrder.findUnique({
    where: { id: id },
    include: {
      customer: true,
      items: true,
      workOrder: { select: { id: true, code: true } },
    },
  });

  // console.log(po);

  if (!po) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ po });
}

const Item = z.object({
  id: z.string().cuid().optional(),
  title: z.string().min(1),
  qtyOrdered: z.coerce.number().int().min(1),
  unitPrice: z.coerce.number().int().min(0).nullable().optional(),
  size: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  material: z.string().optional().nullable(),
  partition: z.string().optional().nullable(),
  accessories: z.string().optional().nullable(),
  finishing: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  specsJson: z.string().optional().nullable(),
});

const Body = z.object({
  code: z.string().min(3),
  customerName: z.string().min(1),
  customerPhone: z.string().optional().nullable(),
  status: z.enum([
    "DRAFT",
    "CONFIRMED",
    "PARTIALLY_FULFILLED",
    "FULFILLED",
    "CANCELED",
  ]),
  orderDate: z.string().datetime().optional(),
  promisedShip: z.string().datetime().optional().nullable(),
  depositAmt: z.coerce.number().int().min(0).optional().nullable(),
  salesName: z.string().optional().nullable(),
  shipOption: z.enum(ShipOption).optional().nullable(),
  shipAddress: z.string().optional().nullable(),
  brandingReq: z.string().optional().nullable(),
  csNotes: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  items: z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(Item).min(1)),
});

export async function PUT(req: Request, { params }: { params: Params }) {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const json = await req.json();
    const body = Body.parse(json);

    // cari/buat customer seperti sebelumnya (findFirst + create/update)
    let customer = await prisma.customer.findFirst({
      where: {
        AND: [
          { name: { equals: body.customerName } },
          body.customerPhone ? { phone: { equals: body.customerPhone } } : {},
        ],
      },
    });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: body.customerName,
          phone: body.customerPhone ?? undefined,
        },
      });
    }

    // === TRANSAKSI: update PO, replace items, lalu sync WO ===
    const { id } = await params;
    await prisma.$transaction(async (tx) => {
      // 1) update header PO
      await tx.preOrder.update({
        where: { id: id },
        data: {
          code: body.code,
          customerId: customer!.id,
          status: body.status,
          orderDate: body.orderDate ? new Date(body.orderDate) : undefined,
          promisedShip: body.promisedShip
            ? new Date(body.promisedShip)
            : undefined,
          depositAmt: body.depositAmt ?? undefined,
          salesName: body.salesName ?? undefined,
          shipOption: body.shipOption ?? undefined,
          shipAddress: body.shipAddress ?? undefined,
          brandingReq: body.brandingReq ?? undefined,
          csNotes: body.csNotes ?? undefined,
          note: body.note ?? undefined,
        },
      });

      // 2) replace items

      await tx.preOrderItem.deleteMany({ where: { id } });
      await tx.preOrderItem.createMany({
        data: body.items.map((it) => ({
          preOrderId: id,
          title: it.title,
          qtyOrdered: it.qtyOrdered,
          unitPrice: it.unitPrice ?? undefined,
          size: it.size ?? undefined,
          color: it.color ?? undefined,
          material: it.material ?? undefined,
          partition: it.partition ?? undefined,
          accessories: it.accessories ?? undefined,
          finishing: it.finishing ?? undefined,
          note: it.note ?? undefined,
          specsJson: it.specsJson ?? undefined,
        })),
      });

      // 3) hitung ulang planned & due
      const items = await tx.preOrderItem.findMany({
        where: { preOrderId: id },
        select: { qtyOrdered: true },
      });
      const qtyPlanned = items.reduce((a, it) => a + (it.qtyOrdered || 0), 0);

      const po = await tx.preOrder.findUnique({
        where: { id: id },
        include: { customer: true, workOrder: true },
      });
      const dueDate = po?.promisedShip ?? null;

      // 4) pastikan ada WO 1:1, kalau belum ada → buat
      if (!po?.workOrder) {
        const woCode = await generateWoCode(
          po!.code,
          po!.customer?.name || undefined
        );
        await tx.workOrder.create({
          data: {
            code: woCode,
            preOrderId: po!.id,
            qtyPlanned,
            dueDate: dueDate ?? undefined,
            status: "PLANNED",
          },
        });
      } else {
        // 5) update WO existing: qtyPlanned & dueDate
        await tx.workOrder.update({
          where: { id: po.workOrder.id },
          data: {
            qtyPlanned,
            dueDate: dueDate ?? undefined,
          },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.name === "ZodError")
      return NextResponse.json(
        { error: "Validasi gagal", details: e.errors },
        { status: 400 }
      );
    console.error("Update PO unexpected error:", e);
    return mapPrismaError(e);
  }
}
