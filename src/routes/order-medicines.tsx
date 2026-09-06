import { createFileRoute } from "@tanstack/react-router";
import {
  Bike,
  PackageCheck,
  Pill,
  Plus,
  Search,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/pharmacy/app-layout";
import { MedicineFormModal } from "@/components/pharmacy/medicine-form";
import {
  btnPrimary,
  EmptyState,
  iconBtn,
  inputCls,
} from "@/components/pharmacy/ui";
import { usePharmacy } from "@/lib/pharmacy-store";
import { formatINR, toLocalISODate } from "@/lib/pharmacy-utils";

export const Route = createFileRoute("/order-medicines")({
  head: () => ({
    meta: [
      { title: "Order from Distributor — MediConnects" },
      {
        name: "description",
        content:
          "Search the distributor catalogue and order medicines into your MediConnects inventory.",
      },
      { property: "og:title", content: "Order from Distributor — MediConnects" },
      {
        property: "og:description",
        content: "Search and order medicines from your distributor.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderMedicinesPage,
});

/* ---------- Distributor catalogue (matches the reference screenshot) ---------- */

interface CatalogItem {
  sku: string;
  name: string;
  genericName: string;
  category: string;
  manufacturer: string;
  packSize: string;
  /** Distributor price per pack (₹) */
  price: number;
}

const CATALOG: CatalogItem[] = [
  { sku: "DIST-001", name: "Paracip 500 Tablet", genericName: "Paracetamol 500mg", category: "Analgesic", manufacturer: "Cipla Ltd", packSize: "strip of 10 tablets", price: 11.09 },
  { sku: "DIST-002", name: "Dolo 650", genericName: "Paracetamol 650mg", category: "Tablets", manufacturer: "Micro Labs", packSize: "strip of 15 tablets", price: 31.5 },
  { sku: "DIST-003", name: "Amoxil 500", genericName: "Amoxicillin 500mg", category: "Capsules", manufacturer: "GSK", packSize: "strip of 10 capsules", price: 98 },
  { sku: "DIST-004", name: "Cetzine 10", genericName: "Cetirizine 10mg", category: "Tablets", manufacturer: "Dr. Reddy", packSize: "strip of 10 tablets", price: 26 },
  { sku: "DIST-005", name: "Omez 20", genericName: "Omeprazole 20mg", category: "Capsules", manufacturer: "Dr. Reddy", packSize: "strip of 15 capsules", price: 56 },
  { sku: "DIST-006", name: "Atorva 20", genericName: "Atorvastatin 20mg", category: "Tablets", manufacturer: "Zydus", packSize: "strip of 14 tablets", price: 145 },
  { sku: "DIST-007", name: "Azithral 500", genericName: "Azithromycin 500mg", category: "Tablets", manufacturer: "Alembic", packSize: "strip of 5 tablets", price: 119.5 },
  { sku: "DIST-008", name: "Metlong 500", genericName: "Metformin 500mg", category: "Tablets", manufacturer: "Sun Pharma", packSize: "strip of 15 tablets", price: 32.75 },
];

const DELIVERY_SECONDS = 30;

function batchCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const a = letters[Math.floor(Math.random() * letters.length)];
  const b = letters[Math.floor(Math.random() * letters.length)];
  return `${a}${b}${Math.floor(1000 + Math.random() * 9000)}`;
}

/* ---------- Page ---------- */

function OrderMedicinesPage() {
  const { addMedicine, medicines } = usePharmacy();
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  /** sku -> seconds remaining while a delivery is in progress */
  const [deliveries, setDeliveries] = useState<Record<string, number>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATALOG;
    return CATALOG.filter((c) =>
      [c.name, c.genericName, c.manufacturer, c.category, c.sku]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query]);

  // Tick all in-flight deliveries down once per second.
  useEffect(() => {
    const active = Object.keys(deliveries);
    if (active.length === 0) return;
    const timer = setInterval(() => {
      setDeliveries((prev) => {
        const next: Record<string, number> = {};
        for (const [sku, remaining] of Object.entries(prev)) {
          if (remaining > 1) next[sku] = remaining - 1;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [deliveries]);

  function startDelivery(item: CatalogItem) {
    if (deliveries[item.sku] !== undefined) return;
    setDeliveries((prev) => ({ ...prev, [item.sku]: DELIVERY_SECONDS }));
    toast.message(`Order placed for ${item.name}`, {
      description: "A rider is on the way from the distributor.",
    });

    // Add to inventory exactly when the countdown finishes.
    setTimeout(() => {
      const inOneYear = new Date();
      inOneYear.setFullYear(inOneYear.getFullYear() + 1);
      addMedicine({
        name: item.name,
        genericName: item.genericName,
        category: item.category,
        manufacturer: item.manufacturer,
        batchNumber: batchCode(),
        expiryDate: toLocalISODate(inOneYear),
        stock: 50,
        reorderLevel: 10,
        unitPrice: Math.round(item.price * 1.25 * 100) / 100,
        costPrice: item.price,
      });
      toast.success(`${item.name} delivered and added to inventory`, {
        icon: <PackageCheck className="h-4 w-4" />,
      });
    }, DELIVERY_SECONDS * 1000);
  }

  return (
    <AppLayout
      title="Add / Search Medicine"
      subtitle="Order stock directly from your distributor — deliveries arrive in 30 seconds."
      actions={
        <button className={btnPrimary} onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add New
        </button>
      }
    >
      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus
          className={`${inputCls} h-12 rounded-xl pl-11 text-base`}
          placeholder="Search by name, generic, manufacturer or batch..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-card shadow-card">
          <EmptyState
            icon={Truck}
            title="No medicines found"
            message="Nothing in the distributor catalogue matches your search. Try a different name, or add a custom medicine with Add New."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((item) => {
            const remaining = deliveries[item.sku];
            const delivering = remaining !== undefined;
            const progress = delivering
              ? (DELIVERY_SECONDS - remaining) / DELIVERY_SECONDS
              : 0;
            const alreadyInStock = medicines.some(
              (m) => m.name.toLowerCase() === item.name.toLowerCase(),
            );

            return (
              <div
                key={item.sku}
                className="flex flex-col rounded-2xl border bg-card p-5 shadow-card transition-shadow hover:shadow-lift"
              >
                <div className="flex items-start gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Pill className="h-4 w-4" />
                  </span>
                  <h3 className="font-display text-base font-semibold leading-snug text-card-foreground">
                    {item.name}
                  </h3>
                </div>

                <dl className="mt-3 space-y-1 text-sm">
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground">Manufacturer:</dt>
                    <dd className="font-medium text-foreground">
                      {item.manufacturer}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground">Category:</dt>
                    <dd className="font-medium text-foreground">
                      {item.category}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground">Pack Size:</dt>
                    <dd className="font-medium text-foreground">
                      {item.packSize}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground">Price:</dt>
                    <dd className="font-medium text-foreground">
                      {formatINR(item.price)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-auto pt-4">
                  {delivering ? (
                    <div className="rounded-xl bg-muted/60 p-3">
                      {/* Rider animation: bike travels along the track */}
                      <div className="relative h-6">
                        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-border" />
                        <div
                          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary transition-[width] duration-1000 ease-linear"
                          style={{ width: `${progress * 100}%` }}
                        />
                        <span
                          className="absolute top-1/2 -translate-y-1/2 text-primary transition-[left] duration-1000 ease-linear"
                          style={{ left: `calc(${progress * 100}% - 10px)` }}
                        >
                          <Bike className="h-5 w-5 animate-bounce" />
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs font-medium">
                        <span className="text-primary">
                          Rider delivering your order…
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          0:{String(remaining).padStart(2, "0")}s
                        </span>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => startDelivery(item)}
                      className={`${btnPrimary} w-full`}
                    >
                      <Truck className="h-4 w-4" />
                      {alreadyInStock ? "Reorder to Inventory" : "Add to Inventory"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <MedicineFormModal
        open={addOpen}
        onOpenChange={setAddOpen}
        medicine={null}
      />
    </AppLayout>
  );
}
