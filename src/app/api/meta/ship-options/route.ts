import { NextResponse } from "next/server";
import { ShipOption } from "@prisma/client";

// Tidak perlu auth karena hanya metadata enum (boleh ditambah auth jika mau)
export async function GET() {
  // Ambil semua nilai enum dari @prisma/client
  const options = Object.values(ShipOption);
  return NextResponse.json({ options });
}
