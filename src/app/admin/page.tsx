export default async function AdminDashboard() {
  // TODO: ganti dengan fetch real (mis. prisma) — untuk demo, pakai angka statis
  const kpis = [
    { title: "WO Aktif", value: 5, hint: "dengan status IN_PROGRESS" },
    { title: "Output Hari Ini", value: 180, hint: "good units" },
    { title: "Reject Rate", value: "2.3%", hint: "24h terakhir" },
    { title: "Lead Time Rata2", value: "3.1h", hint: "per operasi" },
  ];

  const quick = [
    { href: "/admin/entries/bulk", label: "Input Bulk per Shift" },
    { href: "/admin/wo", label: "Kelola Work Orders" },
    { href: "/admin/reports", label: "Laporan Produksi" },
  ];
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k) => (
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
          {quick.map((q) => (
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
        <h2 className="text-lg font-semibold mb-2">WIP Ringkas (contoh)</h2>
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b bg-gray-50">
                <th className="py-2 px-3">WO</th>
                <th className="px-3">Operation</th>
                <th className="px-3">Status</th>
                <th className="px-3">Good/Reject</th>
                <th className="px-3">Sisa</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2 px-3">WO-DEMO-00{i}</td>
                  <td className="px-3">Branding</td>
                  <td className="px-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-xl border text-xs">
                      IN_PROGRESS
                    </span>
                  </td>
                  <td className="px-3">60 / 2</td>
                  <td className="px-3">38</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
