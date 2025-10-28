import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const partners = await prisma.partner.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ partners });
}
