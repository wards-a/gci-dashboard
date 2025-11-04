import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

type Params = Promise<{ id: string }>;

const Body = z.object({
  status: z.enum(["PLANNED", "IN_PROGRESS", "DONE", "CANCELED"]),
});

export async function PATCH(req: Request, { params }: { params: Params }) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = Body.parse(await req.json());
  const { id } = await params;

  await prisma.workOrder.update({ where: { id: id }, data: { status } });

  return NextResponse.json({ ok: true });
}
