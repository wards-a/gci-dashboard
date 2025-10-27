import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PreOrderForm from "@/components/preorders/PreOrderForm";

export default async function NewPO() {
  const session = await auth();
  if (!session) redirect("/login");
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Buat Pre‑Order</h1>
      <PreOrderForm mode="create" />
    </div>
  );
}
