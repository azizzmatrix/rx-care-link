import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { usePharmacy } from "@/lib/pharmacy-store";
import type { Medicine } from "@/lib/pharmacy-types";
import { Field, Modal, btnOutline, btnPrimary, inputCls } from "./ui";

const EMPTY_FORM = {
  name: "",
  genericName: "",
  category: "",
  manufacturer: "",
  batchNumber: "",
  expiryDate: "",
  stock: "",
  reorderLevel: "",
  unitPrice: "",
  costPrice: "",
};

type FormState = typeof EMPTY_FORM;

export function MedicineFormModal({
  open,
  onOpenChange,
  medicine,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the form edits this medicine; otherwise it adds a new one. */
  medicine: Medicine | null;
}) {
  const { addMedicine, updateMedicine, medicines } = usePharmacy();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(
      medicine
        ? {
            name: medicine.name,
            genericName: medicine.genericName,
            category: medicine.category,
            manufacturer: medicine.manufacturer,
            batchNumber: medicine.batchNumber,
            expiryDate: medicine.expiryDate,
            stock: String(medicine.stock),
            reorderLevel: String(medicine.reorderLevel),
            unitPrice: String(medicine.unitPrice),
            costPrice: String(medicine.costPrice),
          }
        : EMPTY_FORM,
    );
  }, [open, medicine]);

  const categories = Array.from(
    new Set(medicines.map((m) => m.category)),
  ).sort();

  const set =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const stock = Number(form.stock);
    const reorderLevel = Number(form.reorderLevel || "0");
    const unitPrice = Number(form.unitPrice);
    const costPrice = Number(form.costPrice || "0");

    if (!form.name.trim()) return setError("Medicine name is required.");
    if (!form.expiryDate) return setError("Expiry date is required.");
    if (
      [stock, reorderLevel, unitPrice, costPrice].some(
        (n) => Number.isNaN(n) || n < 0,
      )
    )
      return setError("Stock, reorder level and prices must be valid numbers.");
    if (stock > 0 && !Number.isInteger(stock))
      return setError("Stock must be a whole number.");

    const payload = {
      name: form.name.trim(),
      genericName: form.genericName.trim() || "—",
      category: form.category.trim() || "General",
      manufacturer: form.manufacturer.trim() || "—",
      batchNumber: form.batchNumber.trim() || "—",
      expiryDate: form.expiryDate,
      stock,
      reorderLevel,
      unitPrice,
      costPrice,
    };

    if (medicine) {
      updateMedicine(medicine.id, payload);
      toast.success(`${payload.name} updated`);
    } else {
      addMedicine(payload);
      toast.success(`${payload.name} added to inventory`);
    }
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={medicine ? "Edit medicine" : "Add new medicine"}
      description={
        medicine
          ? `Update details for ${medicine.name}.`
          : "Enter the product details to add it to your inventory."
      }
      width="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Medicine name *">
          <input
            className={inputCls}
            value={form.name}
            onChange={set("name")}
            placeholder="e.g. Dolo 650"
          />
        </Field>
        <Field label="Generic name">
          <input
            className={inputCls}
            value={form.genericName}
            onChange={set("genericName")}
            placeholder="e.g. Paracetamol 650mg"
          />
        </Field>
        <Field label="Category">
          <input
            className={inputCls}
            list="medicine-categories"
            value={form.category}
            onChange={set("category")}
            placeholder="e.g. Tablets"
          />
          <datalist id="medicine-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Manufacturer">
          <input
            className={inputCls}
            value={form.manufacturer}
            onChange={set("manufacturer")}
            placeholder="e.g. Micro Labs"
          />
        </Field>
        <Field label="Batch number">
          <input
            className={inputCls}
            value={form.batchNumber}
            onChange={set("batchNumber")}
            placeholder="e.g. DL2401"
          />
        </Field>
        <Field label="Expiry date *">
          <input
            type="date"
            className={inputCls}
            value={form.expiryDate}
            onChange={set("expiryDate")}
          />
        </Field>
        <Field label="Stock (units)">
          <input
            type="number"
            min={0}
            className={inputCls}
            value={form.stock}
            onChange={set("stock")}
            placeholder="0"
          />
        </Field>
        <Field label="Reorder level">
          <input
            type="number"
            min={0}
            className={inputCls}
            value={form.reorderLevel}
            onChange={set("reorderLevel")}
            placeholder="0"
          />
        </Field>
        <Field label="Selling price (₹)">
          <input
            type="number"
            min={0}
            step="0.01"
            className={inputCls}
            value={form.unitPrice}
            onChange={set("unitPrice")}
            placeholder="0.00"
          />
        </Field>
        <Field label="Purchase cost (₹)">
          <input
            type="number"
            min={0}
            step="0.01"
            className={inputCls}
            value={form.costPrice}
            onChange={set("costPrice")}
            placeholder="0.00"
          />
        </Field>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive sm:col-span-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 sm:col-span-2">
          <button
            type="button"
            className={btnOutline}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button type="submit" className={btnPrimary}>
            {medicine ? "Save changes" : "Add medicine"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
