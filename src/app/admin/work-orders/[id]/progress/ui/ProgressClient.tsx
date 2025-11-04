"use client";
import { useState, useEffect } from "react";

const stages = [
  { key: "CUTTING", label: "Cutting" },
  { key: "BRANDING", label: "Branding" },
  { key: "SEWING", label: "Sewing" },
  { key: "REWORK", label: "Rework" },
  { key: "REJECT", label: "Reject" },
] as const;

const categories = [
  { key: "LINE_IN_HOUSE", label: "Line In House" },
  { key: "BORONGAN_IN_HOUSE", label: "Borongan In House" },
  { key: "BORONGAN_OUT_HOUSE", label: "Borongan Out House" },
  { key: "CMT_VENDOR", label: "CMT / Vendor" },
] as const;

type Log = {
  id: string;
  stage: string;
  qty: number;
  category: string;
  amount?: number;
  note?: string;
  workDate: string;
  recordedBy: string;
  recordedAt: string;
};

export default function ProgressClient({
  wo,
  totals,
  initialLogs,
}: {
  wo: any;
  totals: any;
  initialLogs: Log[];
}) {
  const [t, setT] = useState<any>(totals || {});
  const [logs, setLogs] = useState<Log[]>(initialLogs || []);
  const [stage, setStage] = useState<string>("CUTTING");
  const [qty, setQty] = useState<number>(1);
  const [workDate, setWorkDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState<string>("LINE_IN_HOUSE");
  const [unitCost, setUnitCost] = useState<number>(0);
  const [extraCost, setExtraCost] = useState<number>(0);
  const [partners, setPartners] = useState<any[]>([]);
  const [partnerId, setPartnerId] = useState<string>("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/meta/partners");
      if (res.ok) {
        const j = await res.json();
        setPartners(j.partners || []);
      }
    })();
  }, []);

  const needCost = category !== "LINE_IN_HOUSE";
  const needPartner =
    category === "BORONGAN_IN_HOUSE" ||
    category === "BORONGAN_OUT_HOUSE" ||
    category === "CMT_VENDOR";

  async function add() {
    setMsg("");
    setErr("");
    setSaving(true);

    const body: any = {
      stage,
      category,
      qty,
      note: note || undefined,
      workDate,
    };

    if (needCost) {
      body.unitCost = unitCost;
      if (extraCost) {
        body.extraCost = extraCost;
      }
    }

    if (needPartner) {
      body.partnerId = partnerId;
    }

    const res = await fetch(`/api/admin/work-orders/${wo.id}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      setErr(txt || "Gagal simpan");
      return;
    }

    const j = await res.json();

    setLogs([...logs, j.log]);
    setT({
      ...t,
      [stage]:
        (t[stage] || 0) + (["REWORK", "REJECT"].includes(stage) ? 0 : qty),
    });
    setMsg("Tersimpan");
  }

  async function remove(id: string) {
    if (!confirm("Hapus log ini?")) return;
    const res = await fetch(`/api/admin/work-orders/${wo.id}/progress/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      alert(txt || "Gagal hapus");
      return;
    }
    setLogs(logs.filter((l) => l.id !== id));
    // Optional: refresh ringkasan dengan fetch ulang, atau biarkan server page yang hitung ulang saat reload
  }
  return (
    <div className="space-y-4">
      {/* Ringkasan */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* <div className="rounded-2xl border p-3 text-center bg-gray-50">
          <div className="text-xs opacity-70">Planned</div>
          <div className="text-xl font-semibold">{wo.qtyPlanned}</div>
        </div> */}
        {stages.map((s) => (
          <div key={s.key} className="rounded-2xl border p-3 text-center">
            <div className="text-xs opacity-70">{s.label}</div>
            <div className="text-xl font-semibold">{t[s.key] || 0}</div>
          </div>
        ))}
      </div>

      {/* Form input */}
      <div className="rounded-2xl border p-4 space-y-3">
        <div className="grid md:grid-cols-5 gap-2">
          <select
            className="px-3 py-2 rounded-xl border"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            {stages.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            className="px-3 py-2 rounded-xl border"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            className="px-3 py-2 rounded-xl border"
            inputMode="numeric"
            placeholder="Qty"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value || 0))}
          />
          <input
            type="date"
            className="px-3 py-2 rounded-xl border"
            value={workDate}
            onChange={(e) => setWorkDate(e.target.value)}
          />
          <input
            className="px-3 py-2 rounded-xl border"
            placeholder="Catatan"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {needCost && (
          <div className="grid md:grid-cols-2 gap-2">
            <input
              className="px-3 py-2 rounded-xl border"
              inputMode="numeric"
              placeholder="Biaya/Unit (Rp)"
              value={unitCost}
              onChange={(e) => setUnitCost(Number(e.target.value || 0))}
            />
            {/* <input
              className="px-3 py-2 rounded-xl border"
              inputMode="numeric"
              placeholder="Biaya Tambahan (Rp)"
              value={extraCost}
              onChange={(e) => setExtraCost(Number(e.target.value || 0))}
            /> */}
            {needPartner ? (
              <select
                className="px-3 py-2 rounded-xl border"
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
              >
                <option value="">Pilih Vendor/Partner</option>
                {partners.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <div />
            )}
          </div>
        )}

        <button
          onClick={add}
          disabled={saving}
          className="px-4 py-2 rounded-2xl bg-emerald-600 text-white disabled:opacity-60"
        >
          {saving ? "Menyimpan…" : "Tambah Log"}
        </button>
        {msg && <span className="text-emerald-700 text-sm ml-2">{msg}</span>}
        {err && (
          <span className="text-red-600 text-sm ml-2 whitespace-pre-wrap">
            {err}
          </span>
        )}
      </div>
      {/* Riwayat */}
      <div className="rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-gray-50">
              <th className="py-2 px-3">Tanggal</th>
              <th className="px-3">Stage</th>
              <th className="px-3">Qty</th>
              <th className="px-3">Kategori</th>
              <th className="px-3">Biaya</th>
              <th className="px-3">Catatan</th>
              <th className="px-3">By</th>
              <th className="px-3"></th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-3 px-3 text-center">
                  Belum ada log
                </td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="py-2 px-3">
                    {new Date(l.workDate).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-3">{l.stage}</td>
                  <td className="px-3">{l.qty}</td>
                  <td className="px-3">{l.category}</td>
                  <td className="px-3">
                    {Intl.NumberFormat("id-ID").format((l as any).amount || 0)}
                  </td>
                  <td className="px-3">{l.note ?? "-"}</td>
                  <td className="px-3">{l.recordedBy}</td>
                  <td className="px-3 text-right">
                    <button
                      onClick={() => remove(l.id)}
                      className="px-3 py-1.5 rounded-xl border"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
