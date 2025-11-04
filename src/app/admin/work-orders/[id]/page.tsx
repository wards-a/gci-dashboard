import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { absoluteFetch } from "@/lib/http";
import WOStatusSelect from "./ui/WOStatusSelect";
import ProgressClient from "./progress/ui/ProgressClient";

type Params = Promise<{ id: string }>;

export default async function WorkOrderDetail({ params }: { params: Params }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const { wo } = await absoluteFetch<{ wo: any }>(
    `/api/admin/work-orders/${id}`
  );

  const {
    wo: wo2,
    totals,
    logs,
    costTotals,
  } = await absoluteFetch<{
    wo: any;
    totals: any;
    logs: any[];
    costTotals: any;
  }>(`/api/admin/work-orders/${id}/progress`);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex flex-row gap-3">
            <h1 className="text-2xl font-semibold">{wo.code}</h1>
            <WOStatusSelect woId={wo.id} initial={wo.status} />
          </div>

          <div className="text-sm opacity-70">
            Ordered: {wo.qtyPlanned} · Deadline:{" "}
            {wo.dueDate ? new Date(wo.dueDate).toLocaleDateString() : "-"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {wo.preOrder && (
            <a
              className="px-3 py-1.5 rounded-xl border"
              href={`/admin/preorders/${wo.preOrder.id}`}
            >
              PO: {wo.preOrder.code}
            </a>
          )}
        </div>
      </div>

      {/* Ringkasan biaya per kategori */}
      <h6 className="text-gray-500">Additional Cost</h6>
      <div className="grid md:grid-cols-4 gap-3">
        <div className="rounded-2xl border p-3 text-center bg-gray-50">
          <div className="text-xs opacity-70">Total Biaya</div>
          <div className="text-xl font-semibold">
            Rp {Intl.NumberFormat("id-ID").format(costTotals?.total || 0)}
          </div>
        </div>
        {[
          // "LINE_IN_HOUSE",
          "BORONGAN_IN_HOUSE",
          "BORONGAN_OUT_HOUSE",
          "CMT_VENDOR",
        ].map((k) => (
          <div key={k} className="rounded-2xl border p-3 text-center">
            <div className="text-xs opacity-70">{k.replaceAll("_", " ")}</div>
            <div className="text-xl font-semibold">
              Rp{" "}
              {Intl.NumberFormat("id-ID").format(costTotals?.byCat?.[k] || 0)}
            </div>
          </div>
        ))}
      </div>

      {/* Progress form + riwayat */}
      <h6 className="text-gray-500">Log Progress</h6>
      <ProgressClient wo={wo2} totals={totals} initialLogs={logs} />
    </div>
  );
}
