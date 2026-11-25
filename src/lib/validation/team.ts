import { z } from "zod";

import { percentSchema } from "./appointment";

export const teamMemberInputSchema = z.object({
  id: z.uuid("Team member ID is invalid.").optional(),
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(80, "Name must be 80 characters or fewer."),
  defaultIncentivePercent: percentSchema,
});
