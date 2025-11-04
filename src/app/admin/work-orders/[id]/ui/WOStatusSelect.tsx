"use client";
import { useState } from "react";

const Statuses = ["PLANNED", "IN_PROGRESS", "DONE", "CANCELED"] as const;

export default function WOStatusSelect({
  woId,
  initial,
}: {
  woId: string;
  initial: string;
}) {
  const [val, setVal] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function save(next: string) {
    setSaving(true);
    setMsg("");
    const res = await fetch(`/api/admin/work-orders/${woId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setSaving(false);
    if (!res.ok) {
      setMsg("Gagal simpan");
      return;
    }
    setVal(next);
    // setMsg("Tersimpan");
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="px-1 py-0.5 text-sm rounded-xl border"
        value={val}
        onChange={(e) => save(e.target.value)}
        disabled={saving}
      >
        {Statuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {msg && <span className="text-xs opacity-70">{msg}</span>}
    </div>
  );
}
