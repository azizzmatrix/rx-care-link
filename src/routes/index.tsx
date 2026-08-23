import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarClock,
  IndianRupee,
  Pill,
  ReceiptText,
  TriangleAlert,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppLayout } from "@/components/pharmacy/app-layout";
import { Badge, StatCard, cardCls } from "@/components/pharmacy/ui";
import { usePharmacy } from "@/lib/pharmacy-store";
import {
  formatDateTime,
  formatINR,
  getExpiryStatus,
  isLowStock,
  isOutOfStock,
  isSameLocalDay,
  toLocalISODate,
} from "@/lib/pharmacy-utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — MediConnects Pharmacy" },
      {
        name: "description",
        content:
          "MediConnects pharmacy dashboard: today's sales, stock alerts, expiry warnings and weekly revenue at a glance.",
      },
      { property: "og:title", content: "Dashboard — MediConnects Pharmacy" },
      {
        property: "og:description",
        content:
          "Today's sales, stock alerts, expiry warnings and weekly revenue at a glance.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { medicines, sales } = usePharmacy();

  const todaysSales = sales.filter((s) => isSameLocalDay(s.createdAt));
  const todaysRevenue = todaysSales.reduce((sum, s) => sum + s.total, 0);

  const lowStock = medicines.filter(
    (m) => isLowStock(m) || isOutOfStock(m),
  ).length;
  const expiryIssues = medicines.filter(
    (m) => getExpiryStatus(m) !== "ok",
  ).length;

  // Revenue for the last 7 days
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = toLocalISODate(d);
    const revenue = sales
      .filter((s) => isSameLocalDay(s.createdAt, d))
      .reduce((sum, s) => sum + s.total, 0);
    return {
      day: d.toLocaleDateString("en-IN", { weekday: "short" }),
      date: key,
      revenue: Math.round(revenue),
    };
  });

  const recentSales = sales.slice(0, 6);

  const attention = medicines
    .filter(
      (m) =>
        isOutOfStock(m) || isLowStock(m) || getExpiryStatus(m) !== "ok",
    )
    .slice(0, 6);

  return (
    <AppLayout
      title="Dashboard"
      subtitle="Store overview — sales, stock and expiry health"
    >
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Today's revenue"
          value={formatINR(todaysRevenue)}
          hint={`${todaysSales.length} bill${todaysSales.length === 1 ? "" : "s"} today`}
          icon={IndianRupee}
          tone="success"
        />
        <StatCard
          label="Medicines in stock"
          value={String(medicines.length)}
          hint="Active inventory items"
          icon={Pill}
          tone="primary"
        />
        <StatCard
          label="Low / out of stock"
          value={String(lowStock)}
          hint="Items at or below reorder level"
          icon={TriangleAlert}
          tone="warning"
        />
        <StatCard
          label="Expiry alerts"
          value={String(expiryIssues)}
          hint="Expired or expiring within 90 days"
          icon={CalendarClock}
          tone="destructive"
        />
      </div>

      {/* Revenue chart */}
      <div className={`${cardCls} mt-6 p-5`}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-card-foreground">
              Revenue — last 7 days
            </h2>
            <p className="text-xs text-muted-foreground">
              Daily billed total including GST
            </p>
          </div>
          <Link
            to="/sales"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all sales <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={56}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                tickFormatter={(v: number) => `₹${v}`}
              />
              <Tooltip
                cursor={{ fill: "var(--color-muted)" }}
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "0.75rem",
                  fontSize: 13,
                }}
                formatter={(value) => [formatINR(Number(value)), "Revenue"]}
              />
              <Bar
                dataKey="revenue"
                fill="var(--color-chart-1)"
                radius={[6, 6, 0, 0]}
                maxBarSize={42}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent sales */}
        <div className={`${cardCls} p-5`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-card-foreground">
              Recent sales
            </h2>
            <Link
              to="/sales"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {recentSales.map((sale) => (
              <li
                key={sale.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                    <ReceiptText className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {sale.customerName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sale.id} · {formatDateTime(sale.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">
                    {formatINR(sale.total)}
                  </p>
                  <Badge variant="primary" className="mt-0.5">
                    {sale.paymentMethod}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Attention needed */}
        <div className={`${cardCls} p-5`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-card-foreground">
              Needs attention
            </h2>
            <Link
              to="/inventory"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Open inventory <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {attention.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              All medicines are healthy. Nothing to action right now.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {attention.map((m) => {
                const expiry = getExpiryStatus(m);
                return (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {m.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {m.genericName} · Batch {m.batchNumber}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOutOfStock(m) && (
                        <Badge variant="destructive">Out of stock</Badge>
                      )}
                      {isLowStock(m) && (
                        <Badge variant="warning">{m.stock} left</Badge>
                      )}
                      {expiry === "expired" && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                      {expiry === "expiring" && (
                        <Badge variant="warning">Expiring soon</Badge>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
