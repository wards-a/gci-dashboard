import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PreOrderForm from "@/components/preorders/PreOrderForm";
import { absoluteFetch } from "@/lib/http";

type Params = Promise<{ id: string }>;

export default async function EditPO({ params }: { params: Params }) {
  const session = await auth();
  if (!session) redirect("/login");
  const { id } = await params;
  const { po } = await absoluteFetch<{ po: any }>(`/api/admin/preorders/${id}`);

  const initial = {
    id: po.id,
    code: po.code,
    status: po.status,
    orderDate: po.orderDate
      ? new Date(po.orderDate).toISOString().slice(0, 10)
      : "",
    promisedShip: po.promisedShip
      ? new Date(po.promisedShip).toISOString().slice(0, 10)
      : "",
    depositAmt: po.depositAmt ?? "",
    customerName: po.customer?.name ?? "",
    customerPhone: po.customer?.phone ?? "",
    salesName: po.salesName ?? "",
    shipOption: po.shipOption ?? "",
    shipAddress: po.shipAddress ?? "",
    brandingReq: po.brandingReq ?? "",
    csNotes: po.csNotes ?? "",
    note: po.note ?? "",
    // items custom mode
    items: (po.items || []).map((it: any) => ({
      title: it.title,
      qtyOrdered: it.qtyOrdered,
      unitPrice: it.unitPrice ?? null,
      size: it.size ?? "",
      color: it.color ?? "",
      material: it.material ?? "",
      partition: it.partition ?? "",
      accessories: it.accessories ?? "",
      finishing: it.finishing ?? "",
      note: it.note ?? "",
      specsJson: it.specsJson ?? "",
    })),
  };
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Edit Pre‑Order</h1>
        <a
          href={`/admin/preorders/${po.id}`}
          className="px-3 py-1.5 rounded-xl border"
        >
          Kembali
        </a>
      </div>
      <PreOrderForm mode="edit" initial={initial} />
    </div>
  );
}
