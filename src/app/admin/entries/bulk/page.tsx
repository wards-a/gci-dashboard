import BulkClient from "./ui/BulkClient";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth();
  if (!session) redirect("/login");

  const ops = await prisma.woOperation.findMany({
    where: { status: { in: ["QUEUED", "RUNNING"] } },
    include: { wo: true, operation: { include: { workCenter: true } } },
    orderBy: [{ wo: { code: "asc" } }, { seq: "asc" }],
  });

  const rows = ops.map((op) => ({
    id: op.id,
    woCode: op.wo.code,
    planned: op.wo.qtyPlanned,
    goodMirror: op.qtyGood,
    rejectMirror: op.qtyReject,
    remaining: Math.max(0, op.wo.qtyPlanned - (op.qtyGood + op.qtyReject)),
    opName: op.operation.name,
    wc: op.operation.workCenter.code,
  }));

  return <BulkClient rows={rows} />;
}
