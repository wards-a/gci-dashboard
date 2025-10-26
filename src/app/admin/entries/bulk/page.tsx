import BulkClient from "./ui/BulkClient";
import { prisma } from "@/lib/db";

export default async function Page() {
  const ops = await prisma.woOperation.findMany({
    where: { status: { in: ["QUEUED", "RUNNING"] } },
    include: { wo: true, operation: { include: { workCenter: true } } },
    orderBy: [{ wo: { code: "asc" } }, { seq: "asc" }],
  });
  return <BulkClient ops={ops} />;
}
