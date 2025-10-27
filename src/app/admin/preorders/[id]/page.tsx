import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { absoluteFetch } from "@/lib/http";

export default async function PreOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  const { id } = await params;
  const { po } = await absoluteFetch<{ po: any }>(`/api/admin/preorders/${id}`);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{po.code}</h1>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1.5 rounded-xl border text-xs">
            {po.status}
          </span>
          <a
            href={`/admin/preorders/${po.id}/edit`}
            className="px-3 py-1.5 rounded-xl border"
          >
            Edit
          </a>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-2xl border p-4 space-y-2">
          <div>
            <div className="text-sm opacity-70">Customer</div>
            <div className="font-medium">
              {po.customer?.name ?? "-"}{" "}
              {po.customer?.phone ? `· ${po.customer.phone}` : ""}
            </div>
          </div>
          <div>
            <div className="text-sm opacity-70">Promised Ship</div>
            <div>
              {po.promisedShip
                ? new Date(po.promisedShip).toLocaleDateString()
                : "-"}
            </div>
          </div>
          <div>
            <div className="text-sm opacity-70">Sales</div>
            <div>{po.salesName ?? "-"}</div>
          </div>
          <div>
            <div className="text-sm opacity-70">Opsi Kirim</div>
            <div>{po.shipOption ?? "-"}</div>
          </div>
          <div>
            <div className="text-sm opacity-70">Alamat Kirim</div>
            <div className="whitespace-pre-wrap">{po.shipAddress ?? "-"}</div>
          </div>
        </div>
        <div className="rounded-2xl border p-4 space-y-2">
          <div>
            <div className="text-sm opacity-70">Syarat Branding Khusus</div>
            <div className="whitespace-pre-wrap">{po.brandingReq ?? "-"}</div>
          </div>
          <div>
            <div className="text-sm opacity-70">Catatan CS</div>
            <div className="whitespace-pre-wrap">{po.csNotes ?? "-"}</div>
          </div>
          <div>
            <div className="text-sm opacity-70">Catatan Umum</div>
            <div className="whitespace-pre-wrap">{po.note ?? "-"}</div>
          </div>
        </div>
      </div>
      {/* Tabel items tetap sama seperti sebelumnya */}
      <div className="rounded-2xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b bg-gray-50">
              <th className="py-2 px-3">Item</th>
              <th className="px-3">Qty Order</th>
              <th className="px-3">Allocated</th>
              <th className="px-3">Fulfilled</th>
              <th className="px-3">Sisa</th>
              <th className="px-3">Alokasi</th>
            </tr>
          </thead>
          <tbody>
            {po.items.map((it: any) => {
              const remain = it.qtyOrdered - it.qtyAllocated;
              return (
                <tr key={it.id} className="border-b last:border-0">
                  <td className="py-2 px-3">
                    <div className="font-medium">{it.title}</div>
                    <div className="text-xs opacity-70">
                      {[
                        it.size,
                        it.color,
                        it.material,
                        it.partition,
                        it.accessories,
                        it.finishing,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                    {it.note && (
                      <div className="text-xs opacity-70 mt-1">
                        Catatan: {it.note}
                      </div>
                    )}
                  </td>
                  <td className="px-3">{it.qtyOrdered}</td>
                  <td className="px-3">{it.qtyAllocated}</td>
                  <td className="px-3">{it.qtyFulfilled}</td>
                  <td className="px-3 font-medium">{remain}</td>
                  <td className="px-3">
                    <a
                      className="px-3 py-1.5 rounded-xl border inline-block"
                      href={`/admin/preorders/${po.id}/allocate?item=${it.id}`}
                    >
                      Allocate
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
