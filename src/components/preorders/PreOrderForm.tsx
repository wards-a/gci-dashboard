"use client";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { ShipOption } from "@prisma/client";

const Statuses = [
  "DRAFT",
  "CONFIRMED",
  "PARTIALLY_FULFILLED",
  "FULFILLED",
  "CANCELED",
] as const;

type VariantOpt = { id: string; label: string };

type FormItem = {
  title: string;
  qtyOrdered: number;
  unitPrice?: number | null;
  size?: string;
  color?: string;
  material?: string;
  partition?: string;
  accessories?: string;
  finishing?: string;
  note?: string;
};

const ItemSchema = z.object({
  title: z.string().min(1),
  qtyOrdered: z.number().int().min(1),
  unitPrice: z.number().int().min(0).nullable().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  material: z.string().optional(),
  partition: z.string().optional(),
  accessories: z.string().optional(),
  finishing: z.string().optional(),
  note: z.string().optional(),
  specsJson: z.string().optional(),
});

export const Schema = z.object({
  code: z.string().min(3),
  customerName: z.string().min(1),
  customerPhone: z.string().optional(),
  status: z
    .enum([
      "DRAFT",
      "CONFIRMED",
      "PARTIALLY_FULFILLED",
      "FULFILLED",
      "CANCELED",
    ])
    .default("DRAFT"),
  orderDate: z.string().optional(),
  promisedShip: z.string().optional(),
  depositAmt: z.number().int().min(0).optional(),
  salesName: z.string().optional(),
  shipOption: z.nativeEnum(ShipOption).optional(),
  shipAddress: z.string().optional(),
  brandingReq: z.string().optional(),
  csNotes: z.string().optional(),
  note: z.string().optional(),
  items: z.array(ItemSchema).min(1),
});

export default function PreOrderForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: any;
}) {
  const [data, setData] = useState<any>(
    () => initial ?? { status: "DRAFT", items: [{ title: "", qtyOrdered: 1 }] }
  );
  const [variants, setVariants] = useState<VariantOpt[]>([]);
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [shipOptions, setShipOptions] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/meta/ship-options", { cache: "no-store" });
      if (res.ok) {
        const j = await res.json();
        setShipOptions(j.options || []);
      }
    })();
  }, []);

  function setField<K extends keyof any>(k: K, v: any) {
    setData((d: any) => ({ ...d, [k]: v }));
  }
  function addItem() {
    setData((d: any) => ({
      ...d,
      items: [...d.items, { title: "", qtyOrdered: 1 }],
    }));
  }
  function delItem(i: number) {
    setData((d: any) => {
      const arr = d.items.filter((_: any, idx: number) => idx !== i);
      return { ...d, items: arr.length ? arr : [{ title: "", qtyOrdered: 1 }] };
    });
  }
  function setItem(i: number, key: keyof FormItem, v: any) {
    setData((d: any) => {
      const arr = [...d.items];
      arr[i] = { ...arr[i], [key]: v };
      return { ...d, items: arr };
    });
  }

  async function submit() {
    setErr("");
    setOk("");
    const items = Array.isArray(data.items) ? data.items : [];
    if (items.length === 0) {
      setErr("Minimal 1 item");
      return;
    }
    // cast & validate
    const payload = {
      code: String(data.code || "").trim(),
      customerName: String(data.customerName || "").trim(),
      customerPhone: data.customerPhone
        ? String(data.customerPhone)
        : undefined,
      status: data.status || "DRAFT",
      orderDate: data.orderDate
        ? new Date(data.orderDate).toISOString()
        : undefined,
      promisedShip: data.promisedShip
        ? new Date(data.promisedShip).toISOString()
        : undefined,
      depositAmt: data.depositAmt ? Number(data.depositAmt) : undefined,
      salesName: data.salesName || undefined,
      shipOption: data.shipOption || undefined,
      shipAddress: data.shipAddress || undefined,
      brandingReq: data.brandingReq || undefined,
      csNotes: data.csNotes || undefined,
      note: data.note || undefined,
      items: items.map((it: any) => ({
        title: String(it.title || "").trim(),
        qtyOrdered: Number(it.qtyOrdered || 0),
        unitPrice:
          it.unitPrice === ""
            ? null
            : it.unitPrice != null
            ? Number(it.unitPrice)
            : undefined,
        size: it.size || undefined,
        color: it.color || undefined,
        material: it.material || undefined,
        partition: it.partition || undefined,
        accessories: it.accessories || undefined,
        finishing: it.finishing || undefined,
        note: it.note || undefined,
      })),
    };
    const parsed = Schema.safeParse(payload);
    if (!parsed.success) {
      setErr(
        parsed.error.issues
          .map((e) => e.path.join(".") + ": " + e.message)
          .join("\n")
      );
      return;
    }

    setSaving(true);
    const url =
      mode === "create"
        ? "/api/admin/preorders"
        : `/api/admin/preorders/${data.id}`;
    const method = mode === "create" ? "POST" : "PUT";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setSaving(false);
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      setErr(t || "Gagal menyimpan");
      return;
    }
    const j = await res.json().catch(() => ({}));
    setOk("Tersimpan");
    if (mode === "create" && j.id) {
      window.location.href = `/admin/preorders/${j.id}`;
    }
  }
  const variantMap = useMemo(
    () => Object.fromEntries(variants.map((v) => [v.id, v.label])),
    [variants]
  );

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-2xl border p-4 space-y-3">
          <div className="text-sm font-medium">Header</div>
          <div className="grid gap-2">
            <input
              className="px-3 py-2 rounded-xl border"
              placeholder="PO Code"
              value={data.code || ""}
              onChange={(e) => setField("code", e.target.value)}
            />
            <select
              className="px-3 py-2 rounded-xl border"
              value={data.status || "DRAFT"}
              onChange={(e) => setField("status", e.target.value)}
            >
              {Statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs opacity-70 mb-1">Order Date</div>
                <input
                  type="date"
                  className="px-3 py-2 rounded-xl border w-full"
                  value={data.orderDate || ""}
                  onChange={(e) => setField("orderDate", e.target.value)}
                />
              </div>
              <div>
                <div className="text-xs opacity-70 mb-1">Promised Ship</div>
                <input
                  type="date"
                  className="px-3 py-2 rounded-xl border w-full"
                  value={data.promisedShip || ""}
                  onChange={(e) => setField("promisedShip", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border p-4 space-y-3">
          <div className="text-sm font-medium">Customer</div>
          <input
            className="px-3 py-2 rounded-xl border"
            placeholder="Nama Customer"
            value={data.customerName || ""}
            onChange={(e) => setField("customerName", e.target.value)}
          />
          <input
            className="px-3 py-2 rounded-xl border"
            placeholder="No. HP (opsional)"
            value={data.customerPhone || ""}
            onChange={(e) => setField("customerPhone", e.target.value)}
          />
          <input
            className="px-3 py-2 rounded-xl border"
            placeholder="Sales"
            value={data.salesName || ""}
            onChange={(e) => setField("salesName", e.target.value)}
          />
          <select
            className="px-3 py-2 rounded-xl border"
            value={data.shipOption || ""}
            onChange={(e) =>
              setField("shipOption", e.target.value || undefined)
            }
          >
            <option value="">Opsi Kirim</option>
            {shipOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <textarea
            className="px-3 py-2 rounded-xl border"
            placeholder="Alamat Kirim"
            rows={3}
            value={data.shipAddress || ""}
            onChange={(e) => setField("shipAddress", e.target.value)}
          />
        </div>
      </div>
      <div className="rounded-2xl border p-4 space-y-3">
        <div className="text-sm font-medium">Ketentuan & Catatan</div>
        <textarea
          className="px-3 py-2 rounded-xl border w-full"
          placeholder="Syarat branding khusus"
          rows={2}
          value={data.brandingReq || ""}
          onChange={(e) => setField("brandingReq", e.target.value)}
        />
        <textarea
          className="px-3 py-2 rounded-xl border w-full"
          placeholder="Catatan CS"
          rows={2}
          value={data.csNotes || ""}
          onChange={(e) => setField("csNotes", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            className="px-3 py-2 rounded-xl border"
            placeholder="Deposit (Rp)"
            inputMode="numeric"
            value={data.depositAmt || ""}
            onChange={(e) => setField("depositAmt", e.target.value)}
          />
          <input
            className="px-3 py-2 rounded-xl border"
            placeholder="Catatan umum"
            value={data.note || ""}
            onChange={(e) => setField("note", e.target.value)}
          />
        </div>
      </div>
      <div className="rounded-2xl border p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Items (Custom)</div>
          <button onClick={addItem} className="px-3 py-1.5 rounded-xl border">
            Tambah Item
          </button>
        </div>
        <div className="mt-3 space-y-4">
          {data.items.map((it: FormItem, i: number) => (
            <div
              key={i}
              className="grid md:grid-cols-2 gap-3 border rounded-xl p-3"
            >
              <div className="grid gap-2">
                <input
                  className="px-3 py-2 rounded-xl border"
                  placeholder="Nama / Model"
                  value={it.title || ""}
                  onChange={(e) => setItem(i, "title", e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="px-3 py-2 rounded-xl border"
                    placeholder="Qty"
                    inputMode="numeric"
                    value={it.qtyOrdered || ""}
                    onChange={(e) =>
                      setItem(i, "qtyOrdered", Number(e.target.value || 0))
                    }
                  />
                  <input
                    className="px-3 py-2 rounded-xl border"
                    placeholder="Unit Price (Rp)"
                    inputMode="numeric"
                    value={it.unitPrice ?? ""}
                    onChange={(e) =>
                      setItem(
                        i,
                        "unitPrice",
                        e.target.value === ""
                          ? null
                          : Number(e.target.value || 0)
                      )
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <input
                  className="px-3 py-2 rounded-xl border"
                  placeholder="Ukuran"
                  value={it.size || ""}
                  onChange={(e) => setItem(i, "size", e.target.value)}
                />
                <input
                  className="px-3 py-2 rounded-xl border"
                  placeholder="Warna"
                  value={it.color || ""}
                  onChange={(e) => setItem(i, "color", e.target.value)}
                />
                <input
                  className="px-3 py-2 rounded-xl border"
                  placeholder="Bahan"
                  value={it.material || ""}
                  onChange={(e) => setItem(i, "material", e.target.value)}
                />
                <input
                  className="px-3 py-2 rounded-xl border"
                  placeholder="Partisi"
                  value={it.partition || ""}
                  onChange={(e) => setItem(i, "partition", e.target.value)}
                />
                <input
                  className="px-3 py-2 rounded-xl border"
                  placeholder="Aksesoris"
                  value={it.accessories || ""}
                  onChange={(e) => setItem(i, "accessories", e.target.value)}
                />
                <input
                  className="px-3 py-2 rounded-xl border"
                  placeholder="Finishing"
                  value={it.finishing || ""}
                  onChange={(e) => setItem(i, "finishing", e.target.value)}
                />
                <input
                  className="px-3 py-2 rounded-xl border"
                  placeholder="Catatan item"
                  value={it.note || ""}
                  onChange={(e) => setItem(i, "note", e.target.value)}
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button
                  onClick={() => delItem(i)}
                  className="px-3 py-1.5 rounded-xl border"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
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
        {ok && <span className="text-emerald-700 text-sm">{ok}</span>}
        {err && (
          <span className="text-red-600 text-sm whitespace-pre-wrap">
            {err}
          </span>
        )}
      </div>
    </div>
  );
}
