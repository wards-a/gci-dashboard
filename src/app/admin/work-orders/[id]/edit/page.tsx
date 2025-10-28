import { auth } from "@/auth";
import { redirect } from "next/navigation";
import WorkOrderForm from "@/components/workorders/WorkOrderForm";
import { absoluteFetch } from "@/lib/http";

export default async function EditWO({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/login");
  const { wo } = await absoluteFetch<{ wo: any }>(
    `/api/admin/work-orders/${params.id}`
  );
  const initial = {
    id: wo.id,
    code: wo.code,
    preOrderId: wo.preOrder?.id ?? "",
    qtyPlanned: wo.qtyPlanned,
    dueDate: wo.dueDate ? new Date(wo.dueDate).toISOString().slice(0, 10) : "",
    note: wo.note ?? "",
    status: wo.status,
  };
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Edit Work Order</h1>
      <WorkOrderForm mode="edit" initial={initial} />
    </div>
  );
}
