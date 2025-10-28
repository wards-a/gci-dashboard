import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { absoluteFetch } from "@/lib/http";

type Params = Promise<{ id: string }>;

export default async function WorkOrderDetail({ params }: { params: Params }) {
  const session = await auth();
  if (!session) redirect("/login");
  const { id } = await params;
  const { wo } = await absoluteFetch<{ wo: any }>(
    `/api/admin/work-orders/${id}`
  );

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{wo.code}</h1>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1.5 rounded-xl border text-xs">
            {wo.status}
          </span>
          <a
            className="px-3 py-1.5 rounded-xl border"
            href={`/admin/work-orders/${wo.id}/progress`}
          >
            Progress
          </a>
          <a
            className="px-3 py-1.5 rounded-xl border"
            href={`/admin/work-orders/${wo.id}/edit`}
          >
            Edit
          </a>
        </div>
      </div>

      <div className="rounded-2xl border p-4 text-sm">
        <div className="grid md:grid-cols-2 gap-2">
          <div>
            <span className="opacity-70">Pre‑Order:</span>{" "}
            {wo.preOrder ? (
              <a
                className="underline"
                href={`/admin/preorders/${wo.preOrder.id}`}
              >
                {wo.preOrder.code}
              </a>
            ) : (
              "-"
            )}
          </div>
          <div>
            <span className="opacity-70">Qty Planned:</span>{" "}
            <b>{wo.qtyPlanned}</b>
          </div>
          <div>
            <span className="opacity-70">Due Date:</span>{" "}
            {wo.dueDate ? new Date(wo.dueDate).toLocaleDateString() : "-"}
          </div>
          <div>
            <span className="opacity-70">Catatan:</span> {wo.note ?? "-"}
          </div>
        </div>
      </div>
      <div className="rounded-2xl border">
        <div className="p-3 text-sm font-medium">Allocations</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-gray-50">
              <th className="py-2 px-3">PO Item</th>
              <th className="px-3">Qty</th>
              <th className="px-3">Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {wo.allocations.length === 0 ? (
              <tr>
                <td className="py-3 px-3 text-center" colSpan={3}>
                  Belum ada alokasi
                </td>
              </tr>
            ) : (
              wo.allocations.map((a: any) => (
                <tr key={a.id} className="border-t">
                  <td className="py-2 px-3">{a.preOrderItem?.title ?? "-"}</td>
                  <td className="px-3">{a.qty}</td>
                  <td className="px-3">
                    {new Date(a.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
