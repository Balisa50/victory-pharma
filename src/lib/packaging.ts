/**
 * Multi-level pharmaceutical packaging.
 *
 * Stock is always tracked internally in BASE UNITS (the smallest sellable
 * item — a tablet, an ampoule, 1 ml). Bottles and cartons are derived from
 * per-product conversion rates:
 *
 *   1 bottle  = unitsPerBottle base units
 *   1 carton  = bottlesPerCarton bottles = unitsPerBottle x bottlesPerCarton units
 */

export type PackLevel = "unit" | "bottle" | "tube" | "carton";

export const PACK_LEVELS: PackLevel[] = ["unit", "bottle", "tube", "carton"];

export const PACK_LABELS: Record<PackLevel, string> = {
  unit: "Pack",
  bottle: "Bottle",
  tube: "Tube",
  carton: "Carton",
};

/** The conversion-relevant shape of a product. */
export type Packaging = {
  unitsPerBottle: number;
  bottlesPerCarton: number;
};

/** Base units contained in one pack of the given level. */
export function unitsForPack(p: Packaging, level: PackLevel): number {
  if (level === "unit") return 1;
  if (level === "bottle" || level === "tube") return Math.max(1, p.unitsPerBottle);
  return Math.max(1, p.unitsPerBottle) * Math.max(1, p.bottlesPerCarton);
}

/** Price of one pack, given the per-base-unit price. */
export function pricePerPack(
  p: Packaging & { price: number },
  level: PackLevel
): number {
  return p.price * unitsForPack(p, level);
}

/** How many whole packs of a level the current stock can fulfil. */
export function packsAvailable(
  p: Packaging & { stockUnits: number },
  level: PackLevel
): number {
  return Math.floor(p.stockUnits / unitsForPack(p, level));
}

/** Pack levels a buyer may choose, honouring the admin's per-product flags. */
export function availablePackLevels(p: {
  unitsPerBottle: number;
  bottlesPerCarton: number;
  allowBottleSale: boolean;
  allowCartonSale: boolean;
  allowTubeSale?: boolean;
}): PackLevel[] {
  const levels: PackLevel[] = ["unit"];
  if (p.allowBottleSale && p.unitsPerBottle > 1) levels.push("bottle");
  if (p.allowTubeSale && p.unitsPerBottle > 1) levels.push("tube");
  if (p.allowCartonSale && p.unitsPerBottle * p.bottlesPerCarton > 1) {
    levels.push("carton");
  }
  return levels;
}

/**
 * Human-readable breakdown of a base-unit count into cartons / bottles / units,
 * e.g. "3 cartons, 2 bottles, 5 units".
 */
export function formatStockBreakdown(p: Packaging & { stockUnits: number }): string {
  const unitsPerCarton = unitsForPack(p, "carton");
  const unitsPerBottle = unitsForPack(p, "bottle");

  let remaining = Math.max(0, p.stockUnits);
  const cartons = Math.floor(remaining / unitsPerCarton);
  remaining -= cartons * unitsPerCarton;
  const bottles = Math.floor(remaining / unitsPerBottle);
  remaining -= bottles * unitsPerBottle;
  const units = remaining;

  const parts: string[] = [];
  if (cartons > 0) parts.push(`${cartons} carton${cartons !== 1 ? "s" : ""}`);
  if (bottles > 0) parts.push(`${bottles} bottle${bottles !== 1 ? "s" : ""}`);
  if (units > 0 || parts.length === 0) {
    parts.push(`${units} unit${units !== 1 ? "s" : ""}`);
  }
  return parts.join(", ");
}

/** Pluralised pack label, e.g. (2, "bottle") -> "2 bottles". */
export function formatPackQuantity(quantity: number, level: PackLevel): string {
  const label = PACK_LABELS[level].toLowerCase();
  return `${quantity} ${label}${quantity !== 1 ? "s" : ""}`;
}
