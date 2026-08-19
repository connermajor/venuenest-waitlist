import { z } from "zod";

// One idea: what a valid signup looks like. `company` is a honeypot field
// (real users never see it; bots fill it in).
export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  name: z.string().trim().max(120).optional().or(z.literal("")),
  company: z.string().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
