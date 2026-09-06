import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AppLayout } from "@/components/pharmacy/app-layout";
import { DistributorCatalog } from "@/components/pharmacy/distributor-catalog";
import { MedicineFormModal } from "@/components/pharmacy/medicine-form";
import { btnPrimary } from "@/components/pharmacy/ui";

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

function OrderMedicinesPage() {
  const [addOpen, setAddOpen] = useState(false);

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
      <DistributorCatalog />
      <MedicineFormModal
        open={addOpen}
        onOpenChange={setAddOpen}
        medicine={null}
      />
    </AppLayout>
  );
}
