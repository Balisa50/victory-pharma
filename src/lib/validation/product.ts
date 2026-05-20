import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  price: z.number().positive("Price must be greater than 0"),
  stockQuantity: z.number().int().min(0, "Stock cannot be negative"),
  expiryDate: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      return new Date(val) > new Date();
    }, "Expiry date cannot be in the past"),
  availabilityStatus: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export const updateStockSchema = z.object({
  stockQuantity: z.number().int().min(0, "Stock cannot be negative"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
