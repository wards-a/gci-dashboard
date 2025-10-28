import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

type Params = Promise<{ progressId: string }>;

export async function POST(_req: Request, { params }: { params: Params }) {
  const session = await auth();
  const { progressId } = await params;
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.workProgress.update({
    where: { id: progressId },
    data: { paidAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
