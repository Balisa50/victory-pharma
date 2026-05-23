import { z } from "zod";

/**
 * Fields a retail pharmacy may update on their own profile. Role, status,
 * email and pharmacyId are intentionally NOT editable here.
 */
export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  phone: z.string().trim().min(7, "Phone number is required"),
  pharmacyName: z
    .string()
    .trim()
    .min(2, "Pharmacy name must be at least 2 characters"),
  location: z.string().trim().min(5, "Location is required"),
  businessRegNumber: z.string().trim().max(120).optional().or(z.literal("")),
  licenseNumber: z.string().trim().max(120).optional().or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
