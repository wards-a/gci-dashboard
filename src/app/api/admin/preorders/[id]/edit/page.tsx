import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PreOrderForm from "@/components/preorders/PreOrderForm";

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("fetch failed");
  return res.json();
}

export default async function EditPO({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/login");
  const { po } = await fetchJSON<{ po: any }>(
    `/api/admin/preorders/${params.id}`
  );
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
    items: po.items.map((it: any) => ({
      id: it.id,
      productVarId: it.productVarId,
      label: `${it.productVar.product.name}${
        it.productVar.color ? " · " + it.productVar.color : ""
      }`,
      qtyOrdered: it.qtyOrdered,
      unitPrice: it.unitPrice ?? null,
    })),
  };
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Edit Pre‑Order</h1>
      <PreOrderForm mode="edit" initial={initial} />
    </div>
  );
}
