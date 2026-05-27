"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, Download, CheckCircle2, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PageHeader, PageBody, Panel } from "@/components/shared/Editorial";

type BulkRow = {
  _row: number;
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
};

type PreviewData = {
  rows: BulkRow[];
  validCount: number;
  totalCount: number;
};

export default function BulkUploadPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    if (!file) return;
    setUploading(true);
    setPreview(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/products/bulk-upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setPreview(json.data);
      if (json.data.validCount === 0) toast.warning("No valid rows found. Check the errors below.");
      else toast.success(`${json.data.validCount} valid rows ready to import.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to parse file");
    } finally {
      setUploading(false);
    }
  }

  async function importRows() {
    if (!preview) return;
    const validRows = preview.rows.filter((r) => r.errors.length === 0);
    if (validRows.length === 0) { toast.error("No valid rows to import"); return; }

    setImporting(true);
    try {
      const res = await fetch("/api/products/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: validRows }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success(`Imported ${json.data.imported} products successfully.`);
      if (json.data.failed > 0) toast.warning(`${json.data.failed} rows failed (e.g. duplicate barcodes).`);
      router.push("/wholesale/products");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Products"
        title="Bulk"
        accent="upload"
        description="Import hundreds of products at once using an Excel spreadsheet."
        back={{ href: "/wholesale/products", label: "Back to products" }}
      />

      <PageBody>
        {/* Step 1: Download template */}
        <Panel eyebrow="Step 1" title="Download" accent="template">
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
            <div className="max-w-md">
              <p className="text-[13.5px] leading-relaxed text-neutral-600">
                Download the template, fill in your products, then upload the file below.
                The template includes an example row to guide you.
              </p>
              <p className="mt-2 text-[12px] text-neutral-400">
                Columns: Product Name · Brand · Category · Batch Number · Expiry Date · Quantity · Cost Price · Selling Price · Barcode
              </p>
            </div>
            <a
              href="/api/products/template"
              download
              className="flex items-center gap-2 rounded-lg border border-[hsl(var(--navy))]/20 px-4 py-2.5 text-[13px] font-semibold text-[hsl(var(--navy))] transition-colors hover:bg-[hsl(var(--offwhite))]"
            >
              <Download className="h-4 w-4" />
              Download template
            </a>
          </div>
        </Panel>

        {/* Step 2: Upload file */}
        <Panel eyebrow="Step 2" title="Upload" accent="your file">
          <div className="px-6 py-5">
            <div
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-8 py-12 transition-colors ${
                dragOver
                  ? "border-[hsl(var(--navy))] bg-[hsl(var(--navy))]/4"
                  : "border-neutral-200 hover:border-[hsl(var(--navy))]/40"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
            >
              <FileSpreadsheet className="mb-3 h-10 w-10 text-[hsl(var(--navy))]/30" />
              <p className="text-[14px] font-medium text-neutral-600">
                Drag & drop your Excel file here
              </p>
              <p className="mt-1 text-[12px] text-neutral-400">or</p>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="mt-3 flex items-center gap-2 rounded-lg bg-[hsl(var(--navy))] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[hsl(var(--navy-3))] disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {uploading ? "Parsing…" : "Choose file"}
              </button>
              <p className="mt-3 text-[11.5px] text-neutral-400">Accepts .xlsx and .xls</p>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        </Panel>

        {/* Step 3: Preview */}
        {preview && (
          <Panel
            eyebrow="Step 3"
            title="Review"
            accent="& import"
            action={
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-neutral-500">
                  <span className="font-semibold text-[hsl(var(--green))]">{preview.validCount}</span> valid ·{" "}
                  <span className="font-semibold text-[hsl(var(--red-2))]">{preview.totalCount - preview.validCount}</span> errors
                </span>
                <button
                  onClick={importRows}
                  disabled={importing || preview.validCount === 0}
                  className="rounded-lg bg-[hsl(var(--navy))] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[hsl(var(--navy-3))] disabled:opacity-50"
                >
                  {importing ? "Importing…" : `Import ${preview.validCount} products`}
                </button>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="ed-thead">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">Brand</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3 text-right">Selling Price</th>
                    <th className="px-4 py-3">Barcode</th>
                    <th className="px-4 py-3">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b border-neutral-100 ${
                        row.errors.length > 0 ? "bg-red-50/60" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-neutral-400">{row._row ?? i + 2}</td>
                      <td className="px-4 py-3">
                        {row.errors.length === 0 ? (
                          <CheckCircle2 className="h-4 w-4 text-[hsl(var(--green))]" />
                        ) : (
                          <XCircle className="h-4 w-4 text-[hsl(var(--red-2))]" />
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-[hsl(var(--navy))]">{row.name || "—"}</td>
                      <td className="px-4 py-3 text-neutral-500">{row.brand ?? "—"}</td>
                      <td className="px-4 py-3 text-neutral-500">{row.category || "—"}</td>
                      <td className="px-4 py-3 text-neutral-500">{row.quantity}</td>
                      <td className="px-4 py-3 text-right text-neutral-500">
                        {row.sellingPrice > 0 ? formatCurrency(row.sellingPrice) : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-neutral-400">
                        {row.barcode ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[hsl(var(--red-2))]">
                        {row.errors.length > 0 ? row.errors.join(", ") : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
      </PageBody>
    </>
  );
}
