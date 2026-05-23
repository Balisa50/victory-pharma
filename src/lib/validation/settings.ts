import { z } from "zod";

const optionalText = z.string().trim().max(280).optional().or(z.literal(""));
const optionalUrl = z
  .string()
  .trim()
  .url("Must be a valid URL")
  .optional()
  .or(z.literal(""));

export const siteSettingsSchema = z.object({
  companyEmail: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  whatsappNumber: optionalText,
  phonePrimary: optionalText,
  phoneSecondary: optionalText,
  address: optionalText,
  facebookUrl: optionalUrl,
  instagramUrl: optionalUrl,
  twitterUrl: optionalUrl,
  footerText: optionalText,
});

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
