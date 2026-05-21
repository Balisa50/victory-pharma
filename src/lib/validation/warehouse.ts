import { z } from "zod";

/** Add stock, entered in cartons / bottles / loose units. */
export const addStockSchema = z.object({
  productId: z.string().cuid(),
  cartons: z.number().int().min(0).default(0),
  bottles: z.number().int().min(0).default(0),
  units: z.number().int().min(0).default(0),
  note: z.string().max(280).optional(),
});

/** Manual signed adjustment in base units, with an audit reason. */
export const adjustStockSchema = z.object({
  productId: z.string().cuid(),
  adjustment: z
    .number()
    .int()
    .refine((n) => n !== 0, "Adjustment cannot be zero"),
  reason: z.string().min(3, "A reason is required"),
});

export type AddStockInput = z.infer<typeof addStockSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
