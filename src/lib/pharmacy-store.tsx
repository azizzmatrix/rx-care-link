import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { seedMedicines, seedSales } from "./pharmacy-data";
import { computeTotals } from "./pharmacy-utils";
import type {
  Medicine,
  MedicineInput,
  PaymentMethod,
  Sale,
  SaleItem,
} from "./pharmacy-types";

interface RecordSaleInput {
  customerName: string;
  paymentMethod: PaymentMethod;
  discountPercent: number;
  items: SaleItem[];
}

interface PharmacyContextValue {
  medicines: Medicine[];
  sales: Sale[];
  addMedicine: (input: MedicineInput) => Medicine;
  updateMedicine: (id: string, input: MedicineInput) => void;
  deleteMedicine: (id: string) => void;
  recordSale: (input: RecordSaleInput) => Sale;
}

const PharmacyContext = createContext<PharmacyContextValue | null>(null);

export function PharmacyProvider({ children }: { children: ReactNode }) {
  const [medicines, setMedicines] = useState<Medicine[]>(seedMedicines);
  const [sales, setSales] = useState<Sale[]>(seedSales);
  const [nextMedicineNo, setNextMedicineNo] = useState(seedMedicines.length + 1);
  const [nextInvoiceNo, setNextInvoiceNo] = useState(1080);

  const addMedicine = useCallback(
    (input: MedicineInput) => {
      const medicine: Medicine = {
        ...input,
        id: `MED-${String(nextMedicineNo).padStart(3, "0")}`,
      };
      setMedicines((prev) => [medicine, ...prev]);
      setNextMedicineNo((n) => n + 1);
      return medicine;
    },
    [nextMedicineNo],
  );

  const updateMedicine = useCallback((id: string, input: MedicineInput) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === id ? { ...input, id } : m)),
    );
  }, []);

  const deleteMedicine = useCallback((id: string) => {
    setMedicines((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const recordSale = useCallback(
    (input: RecordSaleInput) => {
      const { subtotal, discountAmount, taxAmount, total } = computeTotals(
        input.items,
        input.discountPercent,
      );
      const sale: Sale = {
        id: `INV-${nextInvoiceNo}`,
        createdAt: new Date().toISOString(),
        customerName: input.customerName.trim() || "Walk-in Customer",
        paymentMethod: input.paymentMethod,
        items: input.items,
        subtotal,
        discountPercent: input.discountPercent,
        discountAmount,
        taxAmount,
        total,
      };
      setSales((prev) => [sale, ...prev]);
      setMedicines((prev) =>
        prev.map((m) => {
          const line = input.items.find((i) => i.medicineId === m.id);
          return line
            ? { ...m, stock: Math.max(0, m.stock - line.quantity) }
            : m;
        }),
      );
      setNextInvoiceNo((n) => n + 1);
      return sale;
    },
    [nextInvoiceNo],
  );

  const value = useMemo(
    () => ({
      medicines,
      sales,
      addMedicine,
      updateMedicine,
      deleteMedicine,
      recordSale,
    }),
    [medicines, sales, addMedicine, updateMedicine, deleteMedicine, recordSale],
  );

  return (
    <PharmacyContext.Provider value={value}>
      {children}
    </PharmacyContext.Provider>
  );
}

export function usePharmacy(): PharmacyContextValue {
  const ctx = useContext(PharmacyContext);
  if (!ctx) throw new Error("usePharmacy must be used within PharmacyProvider");
  return ctx;
}
