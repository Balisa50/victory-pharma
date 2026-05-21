import { z } from "zod";
import { UserRole } from "@prisma/client";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(7, "Phone number is required"),
  password: passwordSchema,
  pharmacyName: z.string().min(2, "Pharmacy name is required"),
  location: z.string().min(5, "Pharmacy location is required"),
  businessRegNumber: z.string().optional(),
  licenseNumber: z.string().optional(),
  role: z.nativeEnum(UserRole),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
