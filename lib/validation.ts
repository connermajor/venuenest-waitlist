import { z } from "zod";

// One idea: what a valid signup looks like. `company` is a honeypot field
// (real users never see it; bots fill it in).
export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  name: z.string().trim().max(120).optional().or(z.literal("")),
  company: z.string().optional(),
  // Which waitlist this signup belongs to. Optional on the wire; the API
  // defaults it to the primary VenueNest list when absent.
  slug: z.string().trim().max(64).optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;

// Project (tenant) slugs are lowercase, url-safe, and stable.
export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter a slug.")
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens.");
