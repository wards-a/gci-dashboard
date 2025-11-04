import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";
import { ShipOption } from "@prisma/client";
import { mapPrismaError } from "@/lib/api/errors";
import { generateWoCode } from "@/lib/wo";

// GET PREORDERS LIST
export async function GET(req: Request) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const q = searchParams.get("q") || undefined;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const pFrom = searchParams.get("promisedFrom");
  const pTo = searchParams.get("promisedTo");

  const where: any = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { code: { contains: q, mode: "insensitive" } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (from || to) {
    where.orderDate = {
      gte: from ? new Date(from) : undefined,
      lt: to ? new Date(to) : undefined,
    };
  }
  if (pFrom || pTo) {
    where.promisedShip = {
      gte: pFrom ? new Date(pFrom) : undefined,
      lt: pTo ? new Date(pTo) : undefined,
    };
  }

  const data = await prisma.preOrder.findMany({
    where,
    orderBy: [{ orderDate: "desc" }],
    include: {
      customer: true,
      // items custom — TANPA productVar
      items: true,
    },
  });

  return NextResponse.json({ data });
}

// POST PREORDERS
const Item = z.object({
  title: z.string().min(1),
  qtyOrdered: z.coerce.number().int().min(1), // coerce dari string "123"
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
  status: z
    .enum([
      "DRAFT",
      "CONFIRMED",
      "PARTIALLY_FULFILLED",
      "FULFILLED",
      "CANCELED",
    ])
    .default("DRAFT"),
  orderDate: z.string().datetime().optional(),
  promisedShip: z.string().datetime().optional().nullable(),
  depositAmt: z.coerce.number().int().min(0).optional().nullable(), // coerce
  salesName: z.string().optional().nullable(),
  shipOption: z.enum(ShipOption).optional().nullable(),
  shipAddress: z.string().optional().nullable(),
  brandingReq: z.string().optional().nullable(),
  csNotes: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  items: z.preprocess(
    (v) => (Array.isArray(v) ? v : []),
    z.array(Item).min(1, "Minimal 1 item")
  ), // fallback & min check
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const json = await req.json();
    const body = Body.parse(json);

    let customer = await prisma.customer.findFirst({
      where: {
        AND: [
          { name: { equals: body.customerName } },
          {
            OR: [
              body.customerPhone
                ? { phone: { equals: body.customerPhone } }
                : {},
              // tanpa phone, cocokkan name saja
            ],
          },
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
    } else {
      // update ringan (sinkronkan nama/phone bila berubah)
      if (
        customer.name !== body.customerName ||
        (body.customerPhone && customer.phone !== body.customerPhone)
      ) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: {
            name: body.customerName,
            phone: body.customerPhone ?? customer.phone,
          },
        });
      }
    }

    const po = await prisma.preOrder.create({
      data: {
        code: body.code,
        customerId: customer.id,
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
        createdBy: session.user?.email ?? "admin",
        items: {
          create: body.items.map((it) => ({
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
        },
      },
      include: { items: true, customer: true },
    });

    // === AUTO CREATE WO ===
    const qtyPlanned = po.items.reduce((a, it) => a + (it.qtyOrdered || 0), 0);
    const dueDate = po.promisedShip ?? null;
    const woCode = await generateWoCode(
      po.code,
      po.customer?.name || undefined
    );

    const wo = await prisma.workOrder.create({
      data: {
        code: woCode,
        preOrderId: po.id,
        qtyPlanned,
        dueDate: dueDate ?? undefined,
        status: "PLANNED",
      },
    });

    return NextResponse.json({ ok: true, id: po.id, woId: wo.id });
  } catch (e: any) {
    if (e?.name === "ZodError")
      return NextResponse.json(
        { error: "Validasi gagal", details: e.errors },
        { status: 400 }
      );
    console.error("Create PO unexpected error:", e);
    return mapPrismaError(e);
  }
}
