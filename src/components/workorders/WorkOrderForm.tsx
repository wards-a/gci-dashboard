"use client";
import { useState, useEffect } from "react";

const Statuses = ["PLANNED", "IN_PROGRESS", "DONE", "CANCELED"] as const;

type Initial = {
  id?: string;
  code?: string;
  preOrderId?: string;
  qtyPlanned?: number;
  dueDate?: string;
  note?: string;
  status?: (typeof Statuses)[number];
};

export default function WorkOrderForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: Initial;
}) {
  const [data, setData] = useState<Initial>(
    () => initial ?? { status: "PLANNED" }
  );
  const [pos, setPos] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/preorders");
      if (res.ok) {
        const j = await res.json();
        setPos(j.data || []);
      }
    })();
  }, []);

  async function submit() {
    setMsg("");
    setErr("");
    setSaving(true);
    const payload = {
      code: String(data.code || "").trim(),
      preOrderId: data.preOrderId || undefined,
      qtyPlanned: Number(data.qtyPlanned || 0),
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      note: data.note || undefined,
      status: data.status || "PLANNED",
    };
    const url =
      mode === "create"
        ? "/api/admin/work-orders"
        : `/api/admin/work-orders/${data.id}`;
    const method = mode === "create" ? "POST" : "PUT";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      setErr(t || "Gagal menyimpan");
      return;
    }
    const j = await res.json().catch(() => ({}));
    setMsg("Tersimpan");
    if (mode === "create" && j.id) {
      window.location.href = `/admin/work-orders/${j.id}`;
    }
  }
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-2xl border p-4 space-y-3">
          <div className="text-sm font-medium">Header</div>
          <input
            className="px-3 py-2 rounded-xl border w-full"
            placeholder="WO Code"
            value={data.code || ""}
            onChange={(e) => setData({ ...data, code: e.target.value })}
          />
          <select
            className="px-3 py-2 rounded-xl border w-full"
            value={data.status || "PLANNED"}
            onChange={(e) =>
              setData({ ...data, status: e.target.value as any })
            }
          >
            {Statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div>
            <div className="text-xs opacity-70 mb-1">Due Date</div>
            <input
              type="date"
              className="px-3 py-2 rounded-xl border w-full"
              value={data.dueDate || ""}
              onChange={(e) => setData({ ...data, dueDate: e.target.value })}
            />
          </div>
        </div>
        <div className="rounded-2xl border p-4 space-y-3">
          <div className="text-sm font-medium">Relasi & Planning</div>
          <select
            className="px-3 py-2 rounded-xl border w-full"
            value={data.preOrderId || ""}
            onChange={(e) =>
              setData({ ...data, preOrderId: e.target.value || undefined })
            }
          >
            <option value="">(Opsional) Link ke Pre‑Order</option>
            {pos.map((po: any) => (
              <option key={po.id} value={po.id}>
                {po.code} — {po.customer?.name ?? "-"}
              </option>
            ))}
          </select>
          <input
            className="px-3 py-2 rounded-xl border w-full"
            placeholder="Qty Planned"
            inputMode="numeric"
            value={data.qtyPlanned ?? ""}
            onChange={(e) =>
              setData({ ...data, qtyPlanned: Number(e.target.value || 0) })
            }
          />
          <textarea
            className="px-3 py-2 rounded-xl border w-full"
            placeholder="Catatan"
            rows={3}
            value={data.note || ""}
            onChange={(e) => setData({ ...data, note: e.target.value })}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={saving}
          className="px-4 py-2 rounded-2xl bg-emerald-600 text-white disabled:opacity-60"
        >
          {saving ? "Menyimpan…" : "Simpan"}
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
