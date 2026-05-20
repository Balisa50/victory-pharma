import { z } from "zod";
import { ComplaintType, ComplaintStatus } from "@prisma/client";

export const createComplaintSchema = z.object({
  orderId: z.string().cuid(),
  type: z.nativeEnum(ComplaintType),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000),
});

export const updateComplaintSchema = z.object({
  status: z.nativeEnum(ComplaintStatus),
  internalNotes: z.string().max(2000).optional(),
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;
export type UpdateComplaintInput = z.infer<typeof updateComplaintSchema>;
