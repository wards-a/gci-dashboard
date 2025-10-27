import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { absoluteFetch } from "@/lib/http";

export default async function PreOrdersPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const { data } = await absoluteFetch<{ data: any[] }>(`/api/admin/preorders`);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pre‑Orders</h1>
        <a
          href="/admin/preorders/new"
          className="px-3 py-1.5 rounded-xl border inline-block"
        >
          + Buat PO
        </a>
      </div>
      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b bg-gray-50">
              <th className="py-2 px-3">PO Code</th>
              <th className="px-3">Customer</th>
              <th className="px-3">Items</th>
              <th className="px-3">Status</th>
              <th className="px-3">Promised Ship</th>
              <th className="px-3">Opsi Kirim</th>
              <th className="px-3 w-[160px]">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.map((po: any) => (
              <tr key={po.id} className="border-b last:border-0">
                <td className="py-2 px-3">{po.code}</td>
                <td className="px-3">{po.customer?.name ?? "-"}</td>
                <td className="px-3">
                  {po.items
                    .map(
                      (it: any) =>
                        `${it.title}${it.color ? " · " + it.color : ""} ×${
                          it.qtyOrdered
                        }`
                    )
                    .join(", ")}
                </td>
                <td className="px-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-xl border text-xs">
                    {po.status}
                  </span>
                </td>
                <td className="px-3">
                  {po.promisedShip
                    ? new Date(po.promisedShip).toLocaleDateString()
                    : "-"}
                </td>
                <td className="px-3">{po.shipOption ?? "-"}</td>
                <td className="px-3">
                  <div className="flex gap-2">
                    <a
                      className="px-3 py-1.5 rounded-xl border inline-block"
                      href={`/admin/preorders/${po.id}`}
                    >
                      Detail
                    </a>
                    <a
                      className="px-3 py-1.5 rounded-xl border inline-block"
                      href={`/admin/preorders/${po.id}/edit`}
                    >
                      Edit
                    </a>
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
