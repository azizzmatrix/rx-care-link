import { Link, useRouterState } from "@tanstack/react-router";
import {
  Cross,
  LayoutDashboard,
  Menu,
  Pill,
  ReceiptText,
  ShoppingCart,
  TriangleAlert,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { usePharmacy } from "@/lib/pharmacy-store";
import { getExpiryStatus, isLowStock, isOutOfStock } from "@/lib/pharmacy-utils";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/inventory", label: "Inventory", icon: Pill, exact: false },
  { to: "/pos", label: "Billing / POS", icon: ShoppingCart, exact: false },
  { to: "/sales", label: "Sales", icon: ReceiptText, exact: false },
] as const;

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Cross className="h-5 w-5" />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-base font-bold tracking-tight text-sidebar-accent-foreground">
          MediConnects
        </span>
        <span className="block text-[11px] font-medium uppercase tracking-widest text-sidebar-foreground/60">
          Pharmacy Suite
        </span>
      </span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => {
        const active = exact ? pathname === to : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            <Icon className="h-4.5 w-4.5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppLayout({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { medicines } = usePharmacy();

  const attentionCount = medicines.filter(
    (m) =>
      isLowStock(m) || isOutOfStock(m) || getExpiryStatus(m) !== "ok",
  ).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="px-5 pb-6 pt-6">
          <Brand />
        </div>
        <div className="flex-1 px-3">
          <NavLinks />
        </div>
        <div className="p-4">
          <div className="rounded-xl bg-sidebar-accent p-3.5">
            <div className="flex items-center gap-2 text-sidebar-accent-foreground">
              <TriangleAlert className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-wide">
                Stock alerts
              </p>
            </div>
            <p className="mt-1.5 text-sm text-sidebar-foreground">
              {attentionCount === 0
                ? "All medicines are healthy."
                : `${attentionCount} item${attentionCount === 1 ? "" : "s"} need attention (low stock / expiry).`}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-xl px-2 py-1.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary/20 font-display text-sm font-bold text-sidebar-primary">
              SA
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold text-sidebar-accent-foreground">
                Store Admin
              </span>
              <span className="block text-xs text-sidebar-foreground/60">
                Pharmacist
              </span>
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 border-b border-sidebar-border bg-sidebar md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Brand />
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-lg p-2 text-sidebar-foreground hover:bg-sidebar-accent"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="border-t border-sidebar-border px-3 pb-3 pt-2">
            <NavLinks onNavigate={() => setMobileOpen(false)} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="md:pl-64">
        <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 md:px-8 md:pt-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
            {actions}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
