import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const items = await prisma.productVariant.findMany({
    where: q
      ? {
          OR: [
            { uniqueCode: { contains: q, mode: "insensitive" } },
            { product: { name: { contains: q, mode: "insensitive" } } },
            { color: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { product: true },
    take: 30,
    orderBy: [{ product: { name: "asc" } }, { uniqueCode: "asc" }],
  });
  const data = items.map((v) => ({
    id: v.id,
    label: `${v.product.name}${v.color ? " · " + v.color : ""} (${
      v.uniqueCode
    })`,
  }));
  return NextResponse.json({ data });
}
