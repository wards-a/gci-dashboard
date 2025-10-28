import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { absoluteFetch } from "@/lib/http";
import ProgressClient from "./ui/ProgressClient";

type Params = Promise<{ id: string }>;

export default async function WOProgressPage({ params }: { params: Params }) {
  const session = await auth();
  if (!session) redirect("/login");
  const { id } = await params;
  const { wo, totals, logs, costTotals } = await absoluteFetch<{
    wo: any;
    totals: any;
    logs: any[];
    costTotals: any;
  }>(`/api/admin/work-orders/${id}/progress`);
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Progress — {wo.code}</h1>
        <a
          className="px-3 py-1.5 rounded-xl border"
          href={`/admin/work-orders/${wo.id}`}
        >
          Kembali
        </a>
      </div>
      <div className="grid md:grid-cols-5 gap-3">
        <div className="rounded-2xl border p-3 text-center bg-gray-50">
          <div className="text-xs opacity-70">Total Biaya</div>
          <div className="text-xl font-semibold">
            Rp {Intl.NumberFormat("id-ID").format(costTotals.total || 0)}
          </div>
        </div>
        {[
          "LINE_IN_HOUSE",
          "BORONGAN_IN_HOUSE",
          "BORONGAN_OUT_HOUSE",
          "CMT_VENDOR",
        ].map((k) => (
          <div key={k} className="rounded-2xl border p-3 text-center">
            <div className="text-xs opacity-70">{k.replaceAll("_", " ")}</div>
            <div className="text-xl font-semibold">
              Rp {Intl.NumberFormat("id-ID").format(costTotals.byCat?.[k] || 0)}
            </div>
          </div>
        ))}
      </div>
      <hr />
      <ProgressClient wo={wo} totals={totals} initialLogs={logs} />
    </div>
  );
}
