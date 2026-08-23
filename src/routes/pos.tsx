import { createFileRoute } from "@tanstack/react-router";
import { Minus, Plus, ReceiptText, Search, ShoppingCart, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/pharmacy/app-layout";
import { InvoiceModal } from "@/components/pharmacy/invoice-modal";
import {
  Badge,
  EmptyState,
  Field,
  btnPrimary,
  cardCls,
  iconBtn,
  inputCls,
} from "@/components/pharmacy/ui";
import { usePharmacy } from "@/lib/pharmacy-store";
import type { PaymentMethod, Sale } from "@/lib/pharmacy-types";
import {
  computeTotals,
  formatINR,
  getExpiryStatus,
  isOutOfStock,
} from "@/lib/pharmacy-utils";

export const Route = createFileRoute("/pos")({
  head: () => ({
    meta: [
      { title: "Billing / POS — MediConnects Pharmacy" },
      {
        name: "description",
        content:
          "MediConnects point-of-sale billing: build a cart, apply discounts and GST, and print invoices.",
      },
      { property: "og:title", content: "Billing / POS — MediConnects Pharmacy" },
      {
        property: "og:description",
        content:
          "Point-of-sale billing: build a cart, apply discounts and GST, and print invoices.",
      },
    ],
  }),
  component: PosPage,
});

const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "Card", "UPI"];

function PosPage() {
  const { medicines, recordSale } = usePharmacy();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [discount, setDiscount] = useState("");
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const available = useMemo(() => {
    const q = search.trim().toLowerCase();
    return medicines
      .filter((m) => !isOutOfStock(m) && getExpiryStatus(m) !== "expired")
      .filter(
        (m) =>
          !q ||
          m.name.toLowerCase().includes(q) ||
          m.genericName.toLowerCase().includes(q),
      );
  }, [medicines, search]);

  const cartLines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, quantity]) => {
          const medicine = medicines.find((m) => m.id === id);
          return medicine ? { medicine, quantity } : null;
        })
        .filter((l): l is NonNullable<typeof l> => l !== null),
    [cart, medicines],
  );

  const discountPercent = Math.min(100, Math.max(0, Number(discount) || 0));
  const totals = computeTotals(
    cartLines.map((l) => ({
      quantity: l.quantity,
      unitPrice: l.medicine.unitPrice,
    })),
    discountPercent,
  );

  function addToCart(id: string) {
    const medicine = medicines.find((m) => m.id === id);
    if (!medicine) return;
    setCart((prev) => {
      const current = prev[id] ?? 0;
      if (current >= medicine.stock) {
        toast.warning(`Only ${medicine.stock} units of ${medicine.name} in stock`);
        return prev;
      }
      return { ...prev, [id]: current + 1 };
    });
  }

  function setQty(id: string, qty: number) {
    const medicine = medicines.find((m) => m.id === id);
    setCart((prev) => {
      if (qty <= 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      const capped = medicine ? Math.min(qty, medicine.stock) : qty;
      return { ...prev, [id]: capped };
    });
  }

  function clearCart() {
    setCart({});
    setDiscount("");
  }

  function checkout() {
    if (cartLines.length === 0) return;
    const sale = recordSale({
      customerName,
      paymentMethod,
      discountPercent,
      items: cartLines.map((l) => ({
        medicineId: l.medicine.id,
        medicineName: l.medicine.name,
        quantity: l.quantity,
        unitPrice: l.medicine.unitPrice,
      })),
    });
    toast.success(`Sale ${sale.id} recorded — ${formatINR(sale.total)}`);
    setLastSale(sale);
    setInvoiceOpen(true);
    clearCart();
    setCustomerName("");
  }

  return (
    <AppLayout
      title="Billing / POS"
      subtitle="Search medicines, build a bill and complete the sale"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Medicine picker */}
        <div className={`${cardCls} p-4 lg:col-span-3`}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className={`${inputCls} pl-9`}
              placeholder="Search medicines to add to the bill…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {available.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="No sellable medicines"
              message="No in-stock, unexpired medicines match your search."
            />
          ) : (
            <ul className="mt-3 grid max-h-[560px] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {available.map((m) => {
                const inCart = cart[m.id] ?? 0;
                const low = m.stock <= m.reorderLevel;
                return (
                  <li key={m.id}>
                    <button
                      onClick={() => addToCart(m.id)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border bg-background p-3 text-left transition-colors hover:border-primary/50 hover:bg-accent/50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {m.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {m.genericName}
                        </span>
                        <span className="mt-1 flex items-center gap-2">
                          <span className="text-sm font-bold text-primary">
                            {formatINR(m.unitPrice)}
                          </span>
                          {low ? (
                            <Badge variant="warning">{m.stock} left</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {m.stock} in stock
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Plus className="h-4 w-4" />
                        {inCart > 0 && (
                          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                            {inCart}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Cart / bill */}
        <div className={`${cardCls} flex flex-col p-4 lg:col-span-2`}>
          <div className="flex items-center gap-2">
            <ReceiptText className="h-4.5 w-4.5 text-primary" />
            <h2 className="font-display text-base font-semibold text-card-foreground">
              Current bill
            </h2>
            {cartLines.length > 0 && (
              <button
                onClick={clearCart}
                className="ml-auto text-xs font-medium text-muted-foreground hover:text-destructive"
              >
                Clear
              </button>
            )}
          </div>

          {cartLines.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="Cart is empty"
              message="Add medicines from the list to start a new bill."
            />
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {cartLines.map(({ medicine, quantity }) => (
                <li key={medicine.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {medicine.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatINR(medicine.unitPrice)} / unit
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className={iconBtn}
                      onClick={() => setQty(medicine.id, quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-7 text-center text-sm font-semibold text-foreground">
                      {quantity}
                    </span>
                    <button
                      className={iconBtn}
                      onClick={() => setQty(medicine.id, quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="w-20 text-right text-sm font-semibold text-foreground">
                    {formatINR(medicine.unitPrice * quantity)}
                  </span>
                  <button
                    className={`${iconBtn} hover:bg-destructive/10 hover:text-destructive`}
                    onClick={() => setQty(medicine.id, 0)}
                    aria-label={`Remove ${medicine.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-auto space-y-3 border-t pt-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Customer name">
                <input
                  className={inputCls}
                  placeholder="Walk-in Customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </Field>
              <Field label="Discount %">
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={inputCls}
                  placeholder="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </Field>
            </div>

            <Field label="Payment method">
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      paymentMethod === method
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </Field>

            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <dt>Subtotal</dt>
                <dd>{formatINR(totals.subtotal)}</dd>
              </div>
              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-success-foreground">
                  <dt>Discount ({discountPercent}%)</dt>
                  <dd>-{formatINR(totals.discountAmount)}</dd>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <dt>GST (5%)</dt>
                <dd>{formatINR(totals.taxAmount)}</dd>
              </div>
              <div className="flex justify-between border-t pt-2 font-display text-lg font-bold text-foreground">
                <dt>Total</dt>
                <dd>{formatINR(totals.total)}</dd>
              </div>
            </dl>

            <button
              className={`${btnPrimary} w-full py-3 text-base`}
              disabled={cartLines.length === 0}
              onClick={checkout}
            >
              Complete sale · {formatINR(totals.total)}
            </button>
          </div>
        </div>
      </div>

      <InvoiceModal
        sale={lastSale}
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
      />
    </AppLayout>
  );
}
