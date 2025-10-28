import { NextResponse } from "next/server";
import { PreOrderStatus } from "@prisma/client";

export async function GET() {
  // Ambil semua nilai enum dari @prisma/client
  const statuses = Object.values(PreOrderStatus);
  return NextResponse.json({ statuses });
}
