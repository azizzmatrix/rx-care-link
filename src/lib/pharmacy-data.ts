import type { Medicine, PaymentMethod, Sale } from "./pharmacy-types";
import { computeTotals, toLocalISODate } from "./pharmacy-utils";

/** Date n days from today as a local yyyy-mm-dd string (keeps demo data fresh). */
function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toLocalISODate(d);
}

function med(
  n: number,
  name: string,
  genericName: string,
  category: string,
  manufacturer: string,
  batchNumber: string,
  expiryInDays: number,
  stock: number,
  reorderLevel: number,
  unitPrice: number,
  costPrice: number,
): Medicine {
  return {
    id: `MED-${String(n).padStart(3, "0")}`,
    name,
    genericName,
    category,
    manufacturer,
    batchNumber,
    expiryDate: daysFromNow(expiryInDays),
    stock,
    reorderLevel,
    unitPrice,
    costPrice,
  };
}

export const seedMedicines: Medicine[] = [
  med(1, "Dolo 650", "Paracetamol 650mg", "Tablets", "Micro Labs", "DL2401", 540, 480, 100, 31.5, 24),
  med(2, "Amoxil 500", "Amoxicillin 500mg", "Capsules", "GSK", "AM2290", 300, 156, 60, 98, 72),
  med(3, "Glycomet 500", "Metformin 500mg", "Tablets", "USV", "GL2477", 720, 320, 80, 42, 30),
  med(4, "Atorva 20", "Atorvastatin 20mg", "Tablets", "Zydus", "AT2330", 400, 210, 60, 145, 110),
  med(5, "Omez 20", "Omeprazole 20mg", "Capsules", "Dr. Reddy's", "OM2512", 45, 90, 40, 56, 40),
  med(6, "Cetzine 10", "Cetirizine 10mg", "Tablets", "GSK", "CZ2418", 610, 520, 100, 26, 18),
  med(7, "Azithral 500", "Azithromycin 500mg", "Tablets", "Alembic", "AZ2305", 380, 134, 50, 119, 89),
  med(8, "Brufen 400", "Ibuprofen 400mg", "Tablets", "Abbott", "BR2461", 290, 240, 60, 34, 25),
  med(9, "Amlong 5", "Amlodipine 5mg", "Tablets", "Micro Labs", "AM2488", 660, 280, 70, 45, 33),
  med(10, "Losar 50", "Losartan 50mg", "Tablets", "Unichem", "LS2410", 30, 75, 40, 88, 66),
  med(11, "Pan 40", "Pantoprazole 40mg", "Tablets", "Alkem", "PN2533", 500, 310, 80, 92, 70),
  med(12, "Benadryl Syrup", "Diphenhydramine 14mg/5ml", "Syrups", "Johnson & Johnson", "BN2377", 240, 64, 30, 118, 90),
  med(13, "Electral ORS", "Oral Rehydration Salts", "Sachets", "FDC", "EL2450", 700, 400, 100, 22, 16),
  med(14, "Calcirol D3", "Cholecalciferol 60K IU", "Supplements", "Cadila", "CD2402", 450, 15, 40, 105, 82),
  med(15, "Volini Gel", "Diclofenac Gel 1%", "Topicals", "Sun Pharma", "VL2491", 360, 48, 25, 135, 102),
  med(16, "Insulin Mixtard", "Human Insulin 30/70", "Injectables", "Novo Nordisk", "IN2214", -12, 22, 25, 385, 310),
  med(17, "Supradyn Daily", "Multivitamin", "Supplements", "Bayer", "SD2388", 20, 8, 30, 42, 31),
  med(18, "Augmentin 625", "Amoxicillin + Clavulanate", "Tablets", "GSK", "AG2456", 330, 96, 40, 204, 164),
];

function makeSale(
  invoiceNo: number,
  daysAgo: number,
  hour: number,
  minute: number,
  customerName: string,
  paymentMethod: PaymentMethod,
  discountPercent: number,
  lines: Array<[medicineIndex: number, quantity: number]>,
): Sale {
  const items = lines.map(([idx, quantity]) => {
    const m = seedMedicines[idx]!;
    return {
      medicineId: m.id,
      medicineName: m.name,
      quantity,
      unitPrice: m.unitPrice,
    };
  });
  const { subtotal, discountAmount, taxAmount, total } = computeTotals(
    items,
    discountPercent,
  );
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return {
    id: `INV-${invoiceNo}`,
    createdAt: d.toISOString(),
    customerName,
    paymentMethod,
    items,
    subtotal,
    discountPercent,
    discountAmount,
    taxAmount,
    total,
  };
}

export const seedSales: Sale[] = [
  makeSale(1079, 0, 9, 5, "Arjun Nair", "Card", 0, [[0, 1], [12, 2]]),
  makeSale(1078, 1, 19, 25, "Neha Joshi", "UPI", 0, [[14, 1], [16, 1]]),
  makeSale(1077, 1, 10, 50, "Vikram Singh", "Cash", 5, [[1, 1], [4, 1]]),
  makeSale(1076, 2, 12, 5, "Fatima Khan", "Card", 0, [[6, 1]]),
  makeSale(1075, 3, 18, 40, "Rahul Mehta", "UPI", 10, [[8, 2], [9, 1], [13, 1]]),
  makeSale(1074, 3, 9, 15, "Walk-in Customer", "Cash", 0, [[7, 1], [11, 1]]),
  makeSale(1073, 4, 16, 20, "Sunita Devi", "Cash", 0, [[2, 2], [3, 1]]),
  makeSale(1072, 5, 11, 45, "Amit Verma", "Card", 0, [[17, 1]]),
  makeSale(1071, 6, 13, 10, "Priya Sharma", "UPI", 5, [[10, 1], [12, 3]]),
  makeSale(1070, 6, 10, 30, "Ramesh Gupta", "Cash", 0, [[0, 2], [5, 1]]),
];
