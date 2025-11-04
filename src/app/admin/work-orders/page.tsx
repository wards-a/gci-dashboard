import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { absoluteFetch } from "@/lib/http";

export default async function WorkOrdersPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const { data } = await absoluteFetch<{ data: any[] }>(
    `/api/admin/work-orders`
  );

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Work Orders</h1>
        <a
          href="/admin/work-orders/new"
          className="px-3 py-1.5 rounded-xl border"
        >
          + Buat WO
        </a>
      </div>
      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b bg-gray-50">
              <th className="py-2 px-3">WO Code</th>
              <th className="px-3">Pre‑Order</th>
              <th className="px-3">Planned</th>
              <th className="px-3">Status</th>
              <th className="px-3">Due</th>
              <th className="px-3 w-[160px]">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.map((wo: any) => (
              <tr key={wo.id} className="border-b last:border-0">
                <td className="py-2 px-3 font-medium">{wo.code}</td>
                <td className="px-3">
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
                </td>
                <td className="px-3">{wo.qtyPlanned}</td>
                <td className="px-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-xl border text-xs">
                    {wo.status}
                  </span>
                </td>
                <td className="px-3">
                  {wo.dueDate ? new Date(wo.dueDate).toLocaleDateString() : "-"}
                </td>
                <td className="px-3">
                  <div className="flex gap-2">
                    <a
                      className="px-3 py-1.5 rounded-xl border"
                      href={`/admin/work-orders/${wo.id}`}
                    >
                      Detail
                    </a>
                    {/* <a
                      className="px-3 py-1.5 rounded-xl border"
                      href={`/admin/work-orders/${wo.id}/edit`}
                    >
                      Edit
                    </a> */}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
