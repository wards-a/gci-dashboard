import { headers } from "next/headers";

export async function getBaseUrl(): Promise<string> {
  // 1) pakai env kalau tersedia (recommended untuk Vercel prod)
  const env = process.env.NEXT_PUBLIC_BASE_URL;
  if (env) return env.replace(/\/$/, "");

  // 2) fallback: rakit dari headers runtime (dev/preview)
  const h = await headers();
  const proto = h.get("x-forwarded-proto") || "http";
  const host = h.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}
export async function absoluteFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  if (!path.startsWith("/"))
    throw new Error('absoluteFetch expects a "/"-prefixed path');

  const base = await getBaseUrl();
  const cookie = (await headers()).get("cookie") ?? "";
  const res = await fetch(base + path, {
    ...init,
    headers: { ...(init.headers || {}), cookie },
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(
      `Fetch ${path} failed: ${res.status} ${res.statusText} ${txt}`
    );
  }

  return res.json() as Promise<T>;
}
