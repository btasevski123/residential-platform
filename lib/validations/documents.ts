import { z } from "zod";

export const DOCUMENT_CATEGORIES = [
  "MEETINGS",
  "RULES",
  "FINANCES",
  "MAINTENANCE",
  "CONTRACTS",
  "OTHER",
] as const;

export const documentSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120, "Title is too long"),
  description: z.string().trim().max(2000, "Description is too long").optional(),
  category: z.enum(DOCUMENT_CATEGORIES, { error: "Choose a category" }),
});

export type DocumentInput = z.infer<typeof documentSchema>;
