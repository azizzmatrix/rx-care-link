export type PaymentMethod = "Cash" | "Card" | "UPI";

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: string;
  manufacturer: string;
  batchNumber: string;
  /** yyyy-mm-dd */
  expiryDate: string;
  stock: number;
  reorderLevel: number;
  unitPrice: number;
  costPrice: number;
}

export type MedicineInput = Omit<Medicine, "id">;

export interface SaleItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
}

export interface Sale {
  id: string;
  createdAt: string;
  customerName: string;
  paymentMethod: PaymentMethod;
  items: SaleItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
}
