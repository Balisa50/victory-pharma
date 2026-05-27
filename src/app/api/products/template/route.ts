import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as XLSX from "xlsx";

/** GET: download the blank Excel import template. */
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "wholesale_admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const headers = [
    "Product Name",
    "Brand",
    "Category",
    "Batch Number",
    "Expiry Date",
    "Quantity",
    "Cost Price",
    "Selling Price",
    "Barcode",
  ];

  const example = [
    "Paracetamol 500mg",
    "Panadol",
    "Analgesics",
    "BATCH-001",
    "2026-12-31",
    "100",
    "5.00",
    "10.00",
    "6009705432015",
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, example]);

  // Column widths
  ws["!cols"] = headers.map(() => ({ wch: 20 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="victory-pharma-product-template.xlsx"',
    },
  });
}
