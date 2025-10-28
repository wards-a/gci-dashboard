import { NextResponse } from "next/server";
import { ShipOption } from "@prisma/client";

export async function GET() {
  // Ambil semua nilai enum dari @prisma/client
  const options = Object.values(ShipOption);
  return NextResponse.json({ options });
}
