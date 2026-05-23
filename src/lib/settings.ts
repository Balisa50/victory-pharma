import { prisma } from "@/lib/db";

const DEFAULT_ID = "default";

export type SiteSettings = {
  id: string;
  companyEmail: string | null;
  whatsappNumber: string | null;
  phonePrimary: string | null;
  phoneSecondary: string | null;
  address: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  footerText: string | null;
};

/**
 * Returns the single site-settings row, creating it on first access.
 * Falls back to environment values so contact info is never blank.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const row = await prisma.siteSetting.upsert({
    where: { id: DEFAULT_ID },
    create: {
      id: DEFAULT_ID,
      phonePrimary: process.env.CONTACT_PHONE ?? null,
      whatsappNumber: process.env.WHATSAPP_LINK ?? null,
    },
    update: {},
  });
  return {
    id: row.id,
    companyEmail: row.companyEmail,
    whatsappNumber: row.whatsappNumber,
    phonePrimary: row.phonePrimary,
    phoneSecondary: row.phoneSecondary,
    address: row.address,
    facebookUrl: row.facebookUrl,
    instagramUrl: row.instagramUrl,
    twitterUrl: row.twitterUrl,
    footerText: row.footerText,
  };
}
