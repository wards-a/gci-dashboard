import { NextResponse } from "next/server";

type PError = { code?: string; meta?: any };

/**
 * Pemetaan error umum Prisma → HTTP response yang jelas.
 * - P2002: Unique constraint failed → 409
 * - P2003: Foreign key constraint failed → 400
 * - P2025: Record not found → 404
 * Default: 500
 */
export function mapPrismaError(e: PError) {
  if (e?.code === "P2002") {
    const target = Array.isArray(e?.meta?.target)
      ? e.meta.target.join(",")
      : e?.meta?.target ?? "unique_field";
    return NextResponse.json(
      { error: `Duplicate value on unique field: ${target}` },
      { status: 409 }
    );
  }
  if (e?.code === "P2003") {
    return NextResponse.json(
      { error: "Foreign key constraint failed" },
      { status: 400 }
    );
  }
  if (e?.code === "P2025") {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }
  return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
}
