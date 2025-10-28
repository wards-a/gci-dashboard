import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { absoluteFetch } from "@/lib/http";

type Params = Promise<{ id: string }>;

export default async function PreOrderDetail({ params }: { params: Params }) {
  const session = await auth();
  if (!session) redirect("/login");
  const { id } = await params;
  const { po } = await absoluteFetch<{ po: any }>(`/api/admin/preorders/${id}`);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="sm:flex items-center justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{po.code}</h1>
          <span className="px-3 py-1.5 rounded-xl border text-xs">
            {po.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            className="px-3 py-1.5 rounded-xl border"
            href={`/admin/work-orders/new?poId=${po.id}`}
          >
            + Generate WO
          </a>
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
            <div className="text-sm opacity-70">Tgl. Masuk</div>
            <div>
              {po.orderDate
                ? new Date(po.orderDate).toLocaleString("id-ID", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "-"}
            </div>
          </div>
          <div>
            <div className="text-sm opacity-70">Tgl. Kirim</div>
            <div>
              {po.promisedShip
                ? new Date(po.promisedShip).toLocaleString("id-ID", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "-"}
            </div>
          </div>

          {/* <div>
            <div className="text-sm opacity-70">Sales</div>
            <div>{po.salesName ?? "-"}</div>
          </div> */}

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
          {/* <div>
            <div className="text-sm opacity-70">Syarat Branding Khusus</div>
            <div className="whitespace-pre-wrap">{po.brandingReq ?? "-"}</div>
          </div> */}
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
      <div className="overflow-x-auto rounded-2xl border">
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
