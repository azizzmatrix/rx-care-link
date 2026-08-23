import { createFileRoute } from "@tanstack/react-router";
import { PackageSearch, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/pharmacy/app-layout";
import { MedicineFormModal } from "@/components/pharmacy/medicine-form";
import {
  Badge,
  EmptyState,
  btnPrimary,
  cardCls,
  iconBtn,
  inputCls,
} from "@/components/pharmacy/ui";
import { usePharmacy } from "@/lib/pharmacy-store";
import type { Medicine } from "@/lib/pharmacy-types";
import {
  daysUntil,
  formatDate,
  formatINR,
  getExpiryStatus,
  isLowStock,
  isOutOfStock,
} from "@/lib/pharmacy-utils";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — MediConnects Pharmacy" },
      {
        name: "description",
        content:
          "Manage MediConnects medicine inventory: stock levels, batches, expiry dates and pricing.",
      },
      { property: "og:title", content: "Inventory — MediConnects Pharmacy" },
      {
        property: "og:description",
        content:
          "Manage medicine inventory: stock levels, batches, expiry dates and pricing.",
      },
    ],
  }),
  component: InventoryPage,
});

type StatusFilter = "all" | "low" | "out" | "expiring" | "expired";

function StockBadge({ medicine }: { medicine: Medicine }) {
  if (isOutOfStock(medicine))
    return <Badge variant="destructive">Out of stock</Badge>;
  if (isLowStock(medicine))
    return <Badge variant="warning">Low · {medicine.stock}</Badge>;
  return <Badge variant="success">{medicine.stock} in stock</Badge>;
}

function ExpiryBadge({ medicine }: { medicine: Medicine }) {
  const status = getExpiryStatus(medicine);
  const days = daysUntil(medicine.expiryDate);
  if (status === "expired")
    return <Badge variant="destructive">Expired</Badge>;
  if (status === "expiring")
    return <Badge variant="warning">{days}d left</Badge>;
  return <span className="text-sm text-muted-foreground">{formatDate(medicine.expiryDate)}</span>;
}

function InventoryPage() {
  const { medicines, deleteMedicine } = usePharmacy();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(medicines.map((m) => m.category))).sort(),
    [medicines],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return medicines.filter((m) => {
      if (category !== "all" && m.category !== category) return false;
      if (status === "low" && !isLowStock(m)) return false;
      if (status === "out" && !isOutOfStock(m)) return false;
      if (status === "expiring" && getExpiryStatus(m) !== "expiring")
        return false;
      if (status === "expired" && getExpiryStatus(m) !== "expired")
        return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        m.manufacturer.toLowerCase().includes(q) ||
        m.batchNumber.toLowerCase().includes(q)
      );
    });
  }, [medicines, search, category, status]);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(m: Medicine) {
    setEditing(m);
    setFormOpen(true);
  }

  function handleDelete(m: Medicine) {
    if (!window.confirm(`Delete ${m.name} from inventory?`)) return;
    deleteMedicine(m.id);
    toast.success(`${m.name} removed from inventory`);
  }

  return (
    <AppLayout
      title="Inventory"
      subtitle={`${medicines.length} medicines · ${filtered.length} shown`}
      actions={
        <button className={btnPrimary} onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add medicine
        </button>
      }
    >
      {/* Filters */}
      <div className={`${cardCls} mb-4 flex flex-col gap-3 p-4 md:flex-row md:items-center`}>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className={`${inputCls} pl-9`}
            placeholder="Search by name, generic, manufacturer or batch…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className={`${inputCls} md:w-48`}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className={`${inputCls} md:w-48`}
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
        >
          <option value="all">All statuses</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
          <option value="expiring">Expiring soon</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className={`${cardCls} overflow-hidden`}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="No medicines found"
            message="Try adjusting your search or filters, or add a new medicine to the inventory."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Medicine</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Batch</th>
                  <th className="px-4 py-3 font-semibold">Expiry</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 text-right font-semibold">Price</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((m) => (
                  <tr key={m.id} className="transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.genericName} · {m.manufacturer}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{m.category}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {m.batchNumber}
                    </td>
                    <td className="px-4 py-3">
                      <ExpiryBadge medicine={m} />
                    </td>
                    <td className="px-4 py-3">
                      <StockBadge medicine={m} />
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground">
                      {formatINR(m.unitPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          className={iconBtn}
                          onClick={() => openEdit(m)}
                          aria-label={`Edit ${m.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className={`${iconBtn} hover:bg-destructive/10 hover:text-destructive`}
                          onClick={() => handleDelete(m)}
                          aria-label={`Delete ${m.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
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

      <MedicineFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        medicine={editing}
      />
    </AppLayout>
  );
}
