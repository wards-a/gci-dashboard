import { headers } from "next/headers";

async function serverFetchJSON<T>(url: string): Promise<T> {
  const cookie = (await headers()).get("cookie") ?? "";
  const res = await fetch(url, {
    cache: "no-store",
    headers: { cookie },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Fetch ${url} failed: ${res.status} ${res.statusText} ${text}`
    );
  }
  return res.json();
}
export default async function AdminDashboard() {
  const [kpis, wip] = await Promise.all([
    serverFetchJSON<{
      activeWO: number;
      todayGood: number;
      rejectRate: number;
      leadTimeAvgH: number;
    }>(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/kpis`),
    serverFetchJSON<{ wip: any[] }>(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/wip`
    ),
  ]);

  const cards = [
    { title: "WO Aktif", value: kpis.activeWO, hint: "RELEASED / IN_PROGRESS" },
    { title: "Output Hari Ini", value: kpis.todayGood, hint: "good units" },
    { title: "Reject Rate", value: `${kpis.rejectRate}%`, hint: "hari ini" },
    {
      title: "Lead Time Rata2",
      value: `${kpis.leadTimeAvgH}h`,
      hint: "7 hari terakhir",
    },
  ];
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((k) => (
          <div key={k.title} className="rounded-2xl border p-4">
            <div className="text-sm opacity-70">{k.title}</div>
            <div className="text-2xl font-semibold mt-1">{k.value}</div>
            <div className="text-xs opacity-60 mt-1">{k.hint}</div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Aksi Cepat</h2>
        <div className="grid md:grid-cols-3 gap-3">
          {[
            { href: "/admin/entries/bulk", label: "Input Bulk per Shift" },
            { href: "/admin/wo", label: "Kelola Work Orders" },
            { href: "/admin/reports", label: "Laporan Produksi" },
          ].map((q) => (
            <a
              key={q.href}
              href={q.href}
              className="rounded-2xl border p-4 hover:bg-gray-50"
            >
              <div className="text-base font-medium">{q.label}</div>
              <div className="text-xs opacity-60 mt-1">Buka {q.href}</div>
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">WIP Ringkas</h2>
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b bg-gray-50">
                <th className="py-2 px-3">WO</th>
                <th className="px-3">Produk</th>
                <th className="px-3">Operation</th>
                <th className="px-3">WC</th>
                <th className="px-3">Good/Reject</th>
                <th className="px-3">Sisa</th>
                <th className="px-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {wip.wip.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-4 px-3 text-center text-sm opacity-70"
                  >
                    Tidak ada WIP
                  </td>
                </tr>
              ) : (
                wip.wip.map((row: any) => (
                  <tr key={row.opId} className="border-b last:border-0">
                    <td className="py-2 px-3">{row.woCode}</td>
                    <td className="px-3">
                      {row.product} {row.variant ? `· ${row.variant}` : ""}
                    </td>
                    <td className="px-3">{row.opName}</td>
                    <td className="px-3">{row.wc}</td>
                    <td className="px-3">
                      {row.good} / {row.reject}
                    </td>
                    <td className="px-3">{row.remaining}</td>
                    <td className="px-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-xl border text-xs">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
