import { z } from "zod";

export const PACKAGING_TYPES = ["pack", "bottle", "tube", "carton"] as const;

export const createProductSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  price: z.number().positive("Unit price must be greater than 0"),
  expiryDate: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      return new Date(val) > new Date();
    }, "Expiry date cannot be in the past"),
  availabilityStatus: z.boolean().default(true),
  imageUrl: z.string().url("Invalid image URL").nullable().optional(),

  // Primary packaging descriptor
  packagingType: z.enum(PACKAGING_TYPES).default("pack"),

  // Multi-level packaging configuration
  unitsPerBottle: z
    .number()
    .int()
    .min(1, "Units per bottle must be at least 1"),
  bottlesPerCarton: z
    .number()
    .int()
    .min(1, "Bottles per carton must be at least 1"),
  stockUnits: z.number().int().min(0, "Stock cannot be negative").default(0),
  lowStockThreshold: z
    .number()
    .int()
    .min(0, "Threshold cannot be negative")
    .default(10),
  minOrderQuantity: z
    .number()
    .int()
    .min(1, "Minimum order quantity must be at least 1")
    .default(1),
  allowBottleSale: z.boolean().default(true),
  allowCartonSale: z.boolean().default(false),
  allowTubeSale: z.boolean().default(false),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
