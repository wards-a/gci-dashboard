import { auth } from "@/auth";
import { redirect } from "next/navigation";
import "./styles.css"; // optional: style kecil untuk sidebar (dibuat di langkah 4)

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-dvh grid grid-cols-1 lg:grid-cols-[240px_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex flex-col gap-2 border-r p-4">
        <Logo />
        <Nav />
      </aside>

      {/* Main area */}
      <div className="flex flex-col min-h-dvh">
        <Topbar />
        <main className="p-4">{children}</main>
      </div>

      {/* Drawer mobile */}
      <MobileDrawer />
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block w-3 h-3 rounded-full bg-emerald-600" />
      <span className="font-semibold">gci-dashboard</span>
    </div>
  );
}

function Nav() {
  const items = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/entries/bulk", label: "Bulk Entry" },
    { href: "/admin/wo", label: "Work Orders" },
    { href: "/admin/reports", label: "Reports" },
  ];
  return (
    <nav className="mt-4 grid gap-1">
      {items.map((it) => (
        <a
          key={it.href}
          href={it.href}
          className="px-3 py-2 rounded-xl hover:bg-gray-100"
        >
          {it.label}
        </a>
      ))}
    </nav>
  );
}

function Topbar() {
  return (
    <header className="h-14 border-b flex items-center justify-between px-3 lg:px-4">
      <button
        className="lg:hidden inline-flex items-center gap-2 px-3 py-2 rounded-xl border"
        data-open-drawer
      >
        <BurgerIcon />
        Menu
      </button>
      <div className="hidden lg:block" />
      <div className="text-sm opacity-70">Admin</div>
    </header>
  );
}

function MobileDrawer() {
  // clientless approach: gunakan css checkbox hack untuk toggle drawer
  return (
    <>
      <input id="drawer" type="checkbox" className="drawer-toggle" />
      <label htmlFor="drawer" className="hidden" data-close-drawer></label>
      <div className="drawer-overlay" />
      <aside className="drawer-panel">
        <div className="p-4 border-b flex items-center justify-between">
          <Logo />
          <label htmlFor="drawer" className="px-3 py-2 rounded-xl border">
            Tutup
          </label>
        </div>
        <div className="p-3">
          <Nav />
        </div>
      </aside>
      {/* bridge button: clicking topbar button toggles checkbox via js-free data attrs */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
(function(){
const openBtn = document.querySelector('[data-open-drawer]');
const closeLabel = document.querySelector('label[for="drawer"]');
if(openBtn && closeLabel){ openBtn.addEventListener('click', ()=> (closeLabel as HTMLLabelElement).click()) }
})();
`,
        }}
      />
    </>
  );
}

function BurgerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  );
}
