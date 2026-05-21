import { z } from "zod";

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().cuid(),
        packLevel: z.enum(["unit", "bottle", "carton"]),
        quantity: z.number().int().positive("Quantity must be at least 1"),
      })
    )
    .min(1, "Cart cannot be empty"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "confirmed",
    "packed",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ]),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
