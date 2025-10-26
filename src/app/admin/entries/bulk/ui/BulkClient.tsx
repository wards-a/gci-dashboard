"use client";
import { useState } from "react";

export default function BulkClient({ ops }: { ops: any[] }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [shift, setShift] = useState("A");
  const [rows, setRows] = useState<
    Record<string, { good: number; reject: number; note: string }>
  >({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  function setVal(id: string, key: "good" | "reject" | "note", val: any) {
    setRows((r) => ({
      ...r,
      [id]: {
        good: r[id]?.good ?? 0,
        reject: r[id]?.reject ?? 0,
        note: r[id]?.note ?? "",
        [key]: val,
      },
    }));
  }

  async function submit() {}

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-3">
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
          disabled={saving}
          className="px-4 py-2 rounded-xl border bg-emerald-600 text-white disabled:opacity-60"
        >
          {saving ? "Menyimpan…" : "Simpan"}
        </button>
        {msg && <span className="text-sm opacity-80">{msg}</span>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">WO</th>
              <th>Operation</th>
              <th>WC</th>
              <th>Planned</th>
              <th>Good</th>
              <th>Reject</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {ops.map((op: any) => (
              <tr key={op.id} className="border-b">
                <td className="py-2">{op.wo.code}</td>
                <td>{op.operation.name}</td>
                <td>{op.operation.workCenter.code}</td>
                <td>{op.wo.qtyPlanned}</td>
                <td>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-24 px-2 py-1 rounded-lg border"
                    value={rows[op.id]?.good ?? ""}
                    onChange={(e) =>
                      setVal(op.id, "good", Number(e.target.value || 0))
                    }
                  />
                </td>
                <td>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-24 px-2 py-1 rounded-lg border"
                    value={rows[op.id]?.reject ?? ""}
                    onChange={(e) =>
                      setVal(op.id, "reject", Number(e.target.value || 0))
                    }
                  />
                </td>
                <td>
                  <input
                    className="w-48 px-2 py-1 rounded-lg border"
                    value={rows[op.id]?.note ?? ""}
                    onChange={(e) => setVal(op.id, "note", e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
