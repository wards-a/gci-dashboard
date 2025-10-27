"use client";
import { useMemo, useState } from "react";

type Row = {
  id: string;
  woCode: string;
  planned: number;
  goodMirror: number;
  rejectMirror: number;
  remaining: number;
  opName: string;
  wc: string;
};
type Draft = { good: number; reject: number; note: string };

export default function BulkClient({ rows }: { rows: Row[] }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [shift, setShift] = useState("A");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // Helper: sisa aktual per baris saat ini (mirror + draft)
  function getCurrentRemaining(r: Row) {
    const d = drafts[r.id];
    const consumed =
      r.goodMirror + r.rejectMirror + (d?.good || 0) + (d?.reject || 0);
    return Math.max(0, r.planned - consumed);
  }
  function setVal(id: string, key: keyof Draft, val: any, row?: Row) {
    setDrafts((prev) => {
      const base: Draft = prev[id] || { good: 0, reject: 0, note: "" };
      let next: Draft = { ...base };
      if (key === "good" || key === "reject") {
        const num = Math.max(0, Number(val || 0));
        next[key] = num;
        // Clamp agar total tidak melebihi remaining
        if (row) {
          const other = key === "good" ? next.reject : next.good;
          const consumedMirror = row.goodMirror + row.rejectMirror;
          const total = num + other + consumedMirror;
          if (total > row.planned) {
            const allowed = Math.max(0, row.planned - (consumedMirror + other));
            next[key] = allowed;
          }
        }
      } else {
        next.note = String(val || "");
      }
      return { ...prev, [id]: next };
    });
  }
  async function submit() {
    setMsg("");
    setErr("");
    const payload = Object.entries(drafts)
      .filter(([, v]) => (v.good || 0) + (v.reject || 0) > 0)
      .map(([id, v]) => ({
        woOperationId: id,
        date: new Date(date).toISOString(),
        shift,
        qtyGood: Number(v.good || 0),
        qtyReject: Number(v.reject || 0),
        note: v.note || undefined,
      }));
    if (payload.length === 0) {
      setMsg("Tidak ada perubahan untuk disimpan");
      return;
    }

    // Validasi client terakhir: tidak boleh melebihi planned
    for (const p of payload) {
      const row = rows.find((r) => r.id === p.woOperationId)!;
      const mirror = row.goodMirror + row.rejectMirror;
      const incoming = p.qtyGood + p.qtyReject;
      if (mirror + incoming > row.planned) {
        setErr(
          `Baris ${row.woCode} · ${row.opName}: melebihi planned (${mirror}+${incoming} > ${row.planned})`
        );
        return;
      }
    }
    setSaving(true);
    const res = await fetch("/api/admin/entries/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (res.ok) {
      setDrafts({});
      setMsg("Tersimpan");
      return;
    }
    const text = await res.text().catch(() => "");
    setErr(text || "Gagal menyimpan");
  }

  function clearRow(id: string) {
    setDrafts((d) => ({ ...d, [id]: { good: 0, reject: 0, note: "" } }));
  }
  // Fill‑down helpers: apply nilai ke semua baris yang masih punya remaining
  function fillDown(type: "good" | "reject", value: number) {
    setDrafts((prev) => {
      const next = { ...prev };
      rows.forEach((r) => {
        if (getCurrentRemaining(r) <= 0) return;
        const base: Draft = next[r.id] || { good: 0, reject: 0, note: "" };
        const other = type === "good" ? base.reject : base.good;
        const consumedMirror = r.goodMirror + r.rejectMirror;
        let v = Math.max(0, Number(value || 0));
        // clamp per baris
        if (consumedMirror + other + v > r.planned) {
          v = Math.max(0, r.planned - (consumedMirror + other));
        }
        next[r.id] = { ...base, [type]: v };
      });
      return next;
    });
  }

  const canSave = useMemo(() => {
    return Object.values(drafts).some(
      (d) => (d.good || 0) + (d.reject || 0) > 0
    );
  }, [drafts]);
  if (rows.length === 0) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold">Bulk Entry per Shift</h1>
        <p className="text-sm text-gray-500 mt-2">
          Belum ada operasi dengan status QUEUED/RUNNING.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-3">
      <h1 className="text-2xl font-semibold">Bulk Entry per Shift</h1>

      <div className="flex gap-3 flex-wrap items-center">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 rounded-xl border"
        />
        <input
          value={shift}
          onChange={(e) => setShift(e.target.value)}
          placeholder="Shift (A/B/C)"
          className="px-3 py-2 rounded-xl border w-28"
        />

        <button
          onClick={submit}
          disabled={saving || !canSave}
          className="px-4 py-2 rounded-xl border bg-emerald-600 text-white disabled:opacity-60"
        >
          {saving ? "Menyimpan…" : "Simpan"}
        </button>
        {msg && <span className="text-sm text-emerald-700">{msg}</span>}
        {err && <span className="text-sm text-red-600">{err}</span>}
      </div>
      {/* Fill‑down controls */}
      <div className="flex gap-2 items-center text-sm">
        <span className="opacity-70">Fill‑down:</span>
        <button
          onClick={() => fillDown("good", 1)}
          className="px-3 py-1.5 rounded-lg border"
        >
          Good = 1
        </button>
        <button
          onClick={() => fillDown("reject", 0)}
          className="px-3 py-1.5 rounded-lg border"
        >
          Reject = 0
        </button>
        {/* Bisa ganti dengan input angka kalau mau fleksibel */}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">WO</th>
              <th>Operation</th>
              <th>WC</th>
              <th>Planned</th>
              <th>Mirror Good/Reject</th>
              <th>Remaining</th>
              <th>Good</th>
              <th>Reject</th>
              <th>Note</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const d = drafts[r.id] || { good: 0, reject: 0, note: "" };
              const remainingLive = getCurrentRemaining(r);
              const warnOver = d.good + d.reject > remainingLive;
              return (
                <tr key={r.id} className="border-b align-top">
                  <td className="py-2">{r.woCode}</td>
                  <td>{r.opName}</td>
                  <td>{r.wc}</td>
                  <td>{r.planned}</td>
                  <td>
                    {r.goodMirror} / {r.rejectMirror}
                  </td>
                  <td
                    className={
                      "font-medium " +
                      (remainingLive === 0 ? "text-emerald-700" : "")
                    }
                  >
                    {remainingLive}
                  </td>
                  <td>
                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="w-24 px-2 py-1 rounded-lg border"
                      value={d.good || ""}
                      onChange={(e) => setVal(r.id, "good", e.target.value, r)}
                    />
                  </td>
                  <td>
                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="w-24 px-2 py-1 rounded-lg border"
                      value={d.reject || ""}
                      onChange={(e) =>
                        setVal(r.id, "reject", e.target.value, r)
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="w-48 px-2 py-1 rounded-lg border"
                      value={d.note}
                      onChange={(e) => setVal(r.id, "note", e.target.value)}
                    />
                    {warnOver && (
                      <div className="text-[11px] text-red-600 mt-1">
                        Input melebihi remaining
                      </div>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => clearRow(r.id)}
                      className="px-2 py-1 rounded-lg border"
                    >
                      Clear
                    </button>
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
