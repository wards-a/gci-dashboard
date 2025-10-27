"use client";
import { useMemo, useState } from "react";

type Cand = {
  id: string;
  code: string;
  status: string;
  qtyPlanned: number;
  allocated: number;
  woRemaining: number;
  dueDate?: string;
};

export default function AllocateClient({
  poId,
  itemId,
  poRemaining,
  initial,
}: {
  poId: string;
  itemId: string;
  poRemaining: number;
  initial: Cand[];
}) {
  const [rows, setRows] = useState<Cand[]>(initial);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string>("");
  const [qty, setQty] = useState<number>(1);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const s = (q || "").toLowerCase();
    return rows.filter((r) => !s || r.code.toLowerCase().includes(s));
  }, [q, rows]);

  function pick(id: string) {
    setSel(id);
  }

  async function allocate() {
    setMsg("");
    setErr("");
    const r = rows.find((x) => x.id === sel);
    if (!r) {
      setErr("Pilih WO terlebih dahulu");
      return;
    }
    const qtyNum = Math.max(1, Number(qty || 0));
    if (qtyNum > poRemaining) {
      setErr(`Qty melebihi sisa PO (${qtyNum} > ${poRemaining})`);
      return;
    }
    if (qtyNum > r.woRemaining) {
      setErr(`Qty melebihi sisa WO (${qtyNum} > ${r.woRemaining})`);
      return;
    }

    setSaving(true);
    const res = await fetch("/api/admin/preorders/allocate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        preOrderItemId: itemId,
        workOrderId: r.id,
        qty: qtyNum,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      setErr(t || "Gagal allocate");
      return;
    }
    setMsg("Berhasil dialokasikan");
    // Update UI: kurangi sisa lokal
    setRows(
      rows.map((x) =>
        x.id === r.id
          ? {
              ...x,
              allocated: x.allocated + qtyNum,
              woRemaining: x.woRemaining - qtyNum,
            }
          : x
      )
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <input
          className="px-3 py-2 rounded-xl border flex-1"
          placeholder="Cari WO code…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-gray-50">
              <th className="py-2 px-3">WO</th>
              <th className="px-3">Planned</th>
              <th className="px-3">Allocated</th>
              <th className="px-3">WO Remaining</th>
              <th className="px-3">Due</th>
              <th className="px-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td className="py-3 px-3 text-center" colSpan={6}>
                  Tidak ada kandidat
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-2 px-3 font-medium">{r.code}</td>
                  <td className="px-3">{r.qtyPlanned}</td>
                  <td className="px-3">{r.allocated}</td>
                  <td className="px-3">{r.woRemaining}</td>
                  <td className="px-3">
                    {r.dueDate ? new Date(r.dueDate).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-3 text-right">
                    <button
                      onClick={() => pick(r.id)}
                      className={`px-3 py-1.5 rounded-xl border ${
                        sel === r.id ? "bg-gray-900 text-white" : "bg-white"
                      }`}
                    >
                      {sel === r.id ? "Dipilih" : "Pilih"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 items-center">
        <input
          className="px-3 py-2 rounded-xl border w-28"
          inputMode="numeric"
          placeholder="Qty"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value || 0))}
        />
        <button
          onClick={allocate}
          disabled={saving || !sel}
          className="px-4 py-2 rounded-2xl bg-emerald-600 text-white disabled:opacity-60"
        >
          {saving ? "Menyimpan…" : "Allocate"}
        </button>
        {msg && <span className="text-emerald-700 text-sm">{msg}</span>}
        {err && (
          <span className="text-red-600 text-sm whitespace-pre-wrap">
            {err}
          </span>
        )}
      </div>
    </div>
  );
}
