import { Badge, Modal, btnPrimary, btnOutline } from "./ui";
import type { Sale } from "@/lib/pharmacy-types";
import { formatDateTime, formatINR } from "@/lib/pharmacy-utils";

export function InvoiceModal({
  sale,
  open,
  onOpenChange,
  actionLabel = "Done",
}: {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionLabel?: string;
}) {
  if (!sale) return null;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Invoice ${sale.id}`}
      description="MediConnects Pharmacy · GSTIN 19ABCDE1234F1Z5"
    >
      <div className="rounded-xl border bg-background p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div>
            <p className="font-semibold text-foreground">{sale.customerName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDateTime(sale.createdAt)}
            </p>
          </div>
          <Badge variant="primary">{sale.paymentMethod}</Badge>
        </div>

        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="pb-2 font-semibold">Item</th>
              <th className="pb-2 text-center font-semibold">Qty</th>
              <th className="pb-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={item.medicineId} className="border-b last:border-0">
                <td className="py-2 pr-2">
                  <p className="font-medium text-foreground">
                    {item.medicineName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatINR(item.unitPrice)} / unit
                  </p>
                </td>
                <td className="py-2 text-center text-foreground">
                  {item.quantity}
                </td>
                <td className="py-2 text-right font-medium text-foreground">
                  {formatINR(item.unitPrice * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <dt>Subtotal</dt>
            <dd>{formatINR(sale.subtotal)}</dd>
          </div>
          {sale.discountAmount > 0 && (
            <div className="flex justify-between text-success-foreground">
              <dt>Discount ({sale.discountPercent}%)</dt>
              <dd>-{formatINR(sale.discountAmount)}</dd>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <dt>GST (5%)</dt>
            <dd>{formatINR(sale.taxAmount)}</dd>
          </div>
          <div className="flex justify-between border-t pt-2 font-display text-base font-bold text-foreground">
            <dt>Total</dt>
            <dd>{formatINR(sale.total)}</dd>
          </div>
        </dl>

        <p className="mt-4 border-t pt-3 text-center text-xs text-muted-foreground">
          Thank you for shopping at MediConnects. Get well soon!
        </p>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button className={btnOutline} onClick={() => window.print()}>
          Print
        </button>
        <button className={btnPrimary} onClick={() => onOpenChange(false)}>
          {actionLabel}
        </button>
      </div>
    </Modal>
  );
}
