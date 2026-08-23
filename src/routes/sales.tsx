import { createFileRoute } from "@tanstack/react-router";
import { Eye, IndianRupee, ReceiptText, Search, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/pharmacy/app-layout";
import { InvoiceModal } from "@/components/pharmacy/invoice-modal";
import {
  Badge,
  EmptyState,
  StatCard,
  cardCls,
  iconBtn,
  inputCls,
} from "@/components/pharmacy/ui";
import { usePharmacy } from "@/lib/pharmacy-store";
import type { Sale } from "@/lib/pharmacy-types";
import { formatDateTime, formatINR, isSameLocalDay } from "@/lib/pharmacy-utils";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: "Sales — MediConnects Pharmacy" },
      {
        name: "description",
        content:
          "MediConnects sales history: browse invoices, revenue totals and payment methods.",
      },
      { property: "og:title", content: "Sales — MediConnects Pharmacy" },
      {
        property: "og:description",
        content:
          "Browse invoices, revenue totals and payment methods.",
      },
    ],
  }),
  component: SalesPage,
});

function SalesPage() {
  const { sales } = usePharmacy();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Sale | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const todaysRevenue = sales
    .filter((s) => isSameLocalDay(s.createdAt))
    .reduce((sum, s) => sum + s.total, 0);
  const avgBill = sales.length > 0 ? totalRevenue / sales.length : 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sales;
    return sales.filter(
      (s) =>
        s.id.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        s.items.some((i) => i.medicineName.toLowerCase().includes(q)),
    );
  }, [sales, search]);

  function viewInvoice(sale: Sale) {
    setSelected(sale);
    setInvoiceOpen(true);
  }

  return (
    <AppLayout
      title="Sales"
      subtitle={`${sales.length} invoices recorded`}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total revenue"
          value={formatINR(totalRevenue)}
          hint={`Across ${sales.length} bills`}
          icon={IndianRupee}
          tone="success"
        />
        <StatCard
          label="Today's revenue"
          value={formatINR(todaysRevenue)}
          hint="Bills closed today"
          icon={TrendingUp}
          tone="primary"
        />
        <StatCard
          label="Average bill"
          value={formatINR(avgBill)}
          hint="Per invoice value"
          icon={ReceiptText}
          tone="warning"
        />
      </div>

      <div className={`${cardCls} mt-6 mb-4 p-4`}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className={`${inputCls} pl-9`}
            placeholder="Search by invoice, customer or medicine…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={`${cardCls} overflow-hidden`}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No sales found"
            message="No invoices match your search. New bills from the POS will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Invoice</th>
                  <th className="px-4 py-3 font-semibold">Date & time</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Items</th>
                  <th className="px-4 py-3 font-semibold">Payment</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                  <th className="px-4 py-3 text-right font-semibold">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((sale) => (
                  <tr
                    key={sale.id}
                    className="transition-colors hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {sale.id}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateTime(sale.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {sale.customerName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {sale.items.reduce((n, i) => n + i.quantity, 0)} item
                      {sale.items.reduce((n, i) => n + i.quantity, 0) === 1
                        ? ""
                        : "s"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="primary">{sale.paymentMethod}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">
                      {formatINR(sale.total)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          className={iconBtn}
                          onClick={() => viewInvoice(sale)}
                          aria-label={`View invoice ${sale.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InvoiceModal
        sale={selected}
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
      />
    </AppLayout>
  );
}
