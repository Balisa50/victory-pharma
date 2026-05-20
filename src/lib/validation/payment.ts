import { z } from "zod";
import { PaymentMethod } from "@prisma/client";

export const submitPaymentSchema = z.object({
  orderId: z.string().cuid(),
  amount: z.number().positive("Amount must be greater than 0"),
  method: z.nativeEnum(PaymentMethod),
  notes: z.string().max(500).optional(),
});

export type SubmitPaymentInput = z.infer<typeof submitPaymentSchema>;
