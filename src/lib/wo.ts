import { prisma } from "@/lib/db";

function sanitize(s: string) {
  return (s || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accent
    .replace(/[^A-Za-z0-9\-\s]/g, "")
    .trim();
}

export async function generateWoCode(poCode: string, customerName?: string) {
  const base = [sanitize(poCode), sanitize(customerName || "")]
    .filter(Boolean)
    .join(" - ");
  const trunk = base.slice(0, 48); // batasi panjang
  let code = trunk || `WO-${Date.now()}`;
  let n = 1;
  while (true) {
    const exist = await prisma.workOrder.findUnique({ where: { code } });
    if (!exist) return code;
    n++;
    code = `${trunk}-${n}`.slice(0, 58);
  }
}
