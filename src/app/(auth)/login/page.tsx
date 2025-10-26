"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Email dan password wajib diisi");
      return;
    }
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Email atau password salah");
      return;
    }
    router.replace("/admin/entries/bulk");
  }

  return (
    <main className="bg-white rounded-3xl shadow-lg p-6">
      <div className="mb-5 text-center">
        <div className="text-2xl font-semibold">
          Masuk ke gcixsouvia-dashboard
        </div>
        {/* <div className="text-sm text-gray-500 mt-1">
          Admin mencatat produksi, WO, dan laporan
        </div> */}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            inputMode="email"
            placeholder="admin@example.com"
            className="mt-1 w-full px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Password</label>
          <div className="mt-1 relative">
            <input
              type={show ? "text" : "password"}
              placeholder="••••••••"
              className="w-full px-4 py-3 pr-12 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm opacity-70"
            >
              {show ? "Sembunyi" : "Lihat"}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-between text-sm">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" className="size-4 rounded border" />
            Ingat saya
          </label>
          <a
            className="text-emerald-700"
            href="#"
            onClick={(e) => e.preventDefault()}
          >
            Lupa password?
          </a>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-semibold active:scale-[.99] disabled:opacity-60"
        >
          {loading ? "Memproses…" : "Masuk"}
        </button>
      </form>

      <p className="text-xs text-center text-gray-500 mt-4">
        v0 UI – belum terhubung ke backend
      </p>
    </main>
  );
}
