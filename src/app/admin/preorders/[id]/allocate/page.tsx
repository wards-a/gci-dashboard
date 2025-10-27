import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { absoluteFetch } from "@/lib/http";
import AllocateClient from "./ui/AllocateClient";

export default async function AllocatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ item?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  const { item } = await searchParams;
  const searchitem = item;
  const { q } = await searchParams;
  const { id } = await params;
  if (!item) redirect(`/admin/preorders/${id}`);

  const { item: itemInfo, candidates } = await absoluteFetch<{
    item: any;
    candidates: any[];
  }>(
    `/api/admin/preorders/${id}/allocate-candidates?item=${item}${
      q ? `&q=${encodeURIComponent(q)}` : ""
    }`
  );

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Allocate — {itemInfo.title}</h1>
        <a
          className="px-3 py-1.5 rounded-xl border"
          href={`/admin/preorders/${id}`}
        >
          Kembali
        </a>
      </div>
      <div className="rounded-2xl border p-4 text-sm">
        <div className="flex flex-wrap gap-4">
          <div>
            <span className="opacity-70">PO:</span> <b>{itemInfo.po.code}</b>
          </div>
          <div>
            <span className="opacity-70">Ordered:</span>{" "}
            <b>{itemInfo.qtyOrdered}</b>
          </div>
          <div>
            <span className="opacity-70">Allocated:</span>{" "}
            <b>{itemInfo.qtyAllocated}</b>
          </div>
          <div>
            <span className="opacity-70">Remaining:</span>{" "}
            <b>{itemInfo.poRemaining}</b>
          </div>
        </div>
      </div>

      <AllocateClient
        poId={id}
        itemId={itemInfo.id}
        poRemaining={itemInfo.poRemaining}
        initial={candidates}
      />
    </div>
  );
}
