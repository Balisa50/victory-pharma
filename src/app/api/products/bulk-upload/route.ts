import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as XLSX from "xlsx";

export interface BulkProductRow {
  name: string;
  brand?: string;
  category: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity: number;
  costPrice?: number;
  sellingPrice: number;
  barcode?: string;
  errors: string[];
}

/** POST: parse an uploaded Excel file and return a preview. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user?.role !== "wholesale_admin" && session?.user?.role !== "manager")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !["xlsx", "xls"].includes(ext)) {
    return NextResponse.json(
      { success: false, error: "Only .xlsx or .xls files are accepted" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  const rows: BulkProductRow[] = raw.map((r, idx) => {
    const errors: string[] = [];

    const name = String(r["Product Name"] ?? r["name"] ?? "").trim();
    if (!name) errors.push("Product name is required");

    const category = String(r["Category"] ?? r["category"] ?? "").trim();
    if (!category) errors.push("Category is required");

    const sellingPriceRaw = Number(r["Selling Price"] ?? r["sellingPrice"] ?? r["price"] ?? 0);
    if (!sellingPriceRaw || sellingPriceRaw <= 0) errors.push("Selling price must be > 0");

    const quantityRaw = Number(r["Quantity"] ?? r["quantity"] ?? r["stock"] ?? 0);
    if (quantityRaw < 0) errors.push("Quantity cannot be negative");

    // Expiry date: accept Date objects (from cellDates) or strings
    let expiryDate: string | undefined;
    const expRaw = r["Expiry Date"] ?? r["expiryDate"] ?? r["expiry"] ?? "";
    if (expRaw instanceof Date) {
      expiryDate = expRaw.toISOString().slice(0, 10);
    } else if (expRaw) {
      expiryDate = String(expRaw).trim();
    }

    return {
      _row: idx + 2, // 1-indexed, accounting for header
      name,
      brand: String(r["Brand"] ?? r["brand"] ?? "").trim() || undefined,
      category,
      batchNumber: String(r["Batch Number"] ?? r["batchNumber"] ?? "").trim() || undefined,
      expiryDate,
      quantity: Math.max(0, Math.floor(quantityRaw)),
      costPrice: Number(r["Cost Price"] ?? r["costPrice"] ?? 0) || undefined,
      sellingPrice: sellingPriceRaw,
      barcode: String(r["Barcode"] ?? r["barcode"] ?? "").trim() || undefined,
      errors,
    } as BulkProductRow & { _row: number };
  });

  const validCount = rows.filter((r) => r.errors.length === 0).length;

  return NextResponse.json({ success: true, data: { rows, validCount, totalCount: rows.length } });
}
