import { auth } from "@/auth";
import { redirect } from "next/navigation";
import WorkOrderForm from "@/components/workorders/WorkOrderForm";

export default async function NewWO() {
  const session = await auth();
  if (!session) redirect("/login");
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Buat Work Order</h1>
      <WorkOrderForm mode="create" />
    </div>
  );
}
