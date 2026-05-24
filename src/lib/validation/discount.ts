import { z } from "zod";

/** Admin applies a discount to an order. Value is positive; type decides shape. */
export const applyDiscountSchema = z.object({
  type: z.enum(["percentage", "fixed"]),
  value: z.number().nonnegative("Discount value cannot be negative"),
});

/** Clear an applied discount. */
export const clearDiscountSchema = z.object({});

export type ApplyDiscountInput = z.infer<typeof applyDiscountSchema>;
