import { z } from "zod";

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().cuid(),
        packLevel: z.enum(["unit", "bottle", "tube", "carton"]),
        quantity: z.number().int().positive("Quantity must be at least 1"),
      })
    )
    .min(1, "Cart cannot be empty"),
  isCredit: z.boolean().optional(),
  notes: z.string().max(500).optional(),
  deliveryAddress: z.string().max(300).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "confirmed",
    "packed",
    "out_for_delivery",
    "delivered",
    "completed",
    "cancelled",
  ]),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
