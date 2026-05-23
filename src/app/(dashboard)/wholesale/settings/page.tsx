"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  siteSettingsSchema,
  type SiteSettingsInput,
} from "@/lib/validation/settings";
import { PageHeader, PageBody, Panel } from "@/components/shared/Editorial";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((d) => d.data);

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
      {hint && !error && (
        <p className="mt-1 text-[11.5px] text-neutral-400">{hint}</p>
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const { data } = useSWR<SiteSettingsInput>("/api/settings", fetcher);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SiteSettingsInput>({
    resolver: zodResolver(siteSettingsSchema),
  });

  useEffect(() => {
    if (data) {
      reset({
        companyEmail: data.companyEmail ?? "",
        whatsappNumber: data.whatsappNumber ?? "",
        phonePrimary: data.phonePrimary ?? "",
        phoneSecondary: data.phoneSecondary ?? "",
        address: data.address ?? "",
        facebookUrl: data.facebookUrl ?? "",
        instagramUrl: data.instagramUrl ?? "",
        twitterUrl: data.twitterUrl ?? "",
        footerText: data.footerText ?? "",
      });
    }
  }, [data, reset]);

  async function onSubmit(values: SiteSettingsInput) {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = (await res.json()) as { success: boolean; error?: string };
    if (json.success) {
      toast.success("Settings saved. Live on the site now.");
    } else {
      toast.error(json.error ?? "Failed to save settings");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Configuration"
        title="Site"
        accent="settings"
        description="Contact details and links edited here update across the public site instantly."
      />

      <PageBody>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Panel eyebrow="Contact" title="How partners" accent="reach you">
            <div className="grid gap-4 px-6 py-6 md:grid-cols-2 md:px-7">
              <Field label="Company email" error={errors.companyEmail?.message}>
                <input
                  {...register("companyEmail")}
                  className="field"
                  placeholder="hello@victorypharmaceutical.com"
                />
              </Field>
              <Field
                label="WhatsApp number / link"
                error={errors.whatsappNumber?.message}
              >
                <input
                  {...register("whatsappNumber")}
                  className="field"
                  placeholder="https://wa.me/220..."
                />
              </Field>
              <Field label="Primary phone" error={errors.phonePrimary?.message}>
                <input
                  {...register("phonePrimary")}
                  className="field"
                  placeholder="+220 000 0000"
                />
              </Field>
              <Field
                label="Secondary phone"
                error={errors.phoneSecondary?.message}
              >
                <input
                  {...register("phoneSecondary")}
                  className="field"
                  placeholder="Optional"
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Address" error={errors.address?.message}>
                  <input
                    {...register("address")}
                    className="field"
                    placeholder="Street, city, region"
                  />
                </Field>
              </div>
            </div>
          </Panel>

          <Panel eyebrow="Presence" title="Social" accent="links">
            <div className="grid gap-4 px-6 py-6 md:grid-cols-3 md:px-7">
              <Field label="Facebook URL" error={errors.facebookUrl?.message}>
                <input
                  {...register("facebookUrl")}
                  className="field"
                  placeholder="https://facebook.com/..."
                />
              </Field>
              <Field label="Instagram URL" error={errors.instagramUrl?.message}>
                <input
                  {...register("instagramUrl")}
                  className="field"
                  placeholder="https://instagram.com/..."
                />
              </Field>
              <Field label="Twitter / X URL" error={errors.twitterUrl?.message}>
                <input
                  {...register("twitterUrl")}
                  className="field"
                  placeholder="https://x.com/..."
                />
              </Field>
            </div>
          </Panel>

          <Panel eyebrow="Public site" title="Footer" accent="text">
            <div className="px-6 py-6 md:px-7">
              <Field
                label="Footer text"
                hint="Shown in the footer across the public site."
                error={errors.footerText?.message}
              >
                <textarea
                  {...register("footerText")}
                  rows={2}
                  className="field"
                  placeholder="Wholesale pharmaceuticals for retail partners across The Gambia."
                />
              </Field>
            </div>
          </Panel>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !data}
              className="btn btn-red"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save settings
            </button>
          </div>
        </form>
      </PageBody>
    </>
  );
}
