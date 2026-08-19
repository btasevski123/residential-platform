import { z } from "zod";

export const ISSUE_CATEGORIES = [
  "GENERAL",
  "ELECTRICITY",
  "WATER",
  "HEATING",
  "ELEVATOR",
  "CLEANING",
  "SECURITY",
  "OTHER",
] as const;

export const ISSUE_STATUSES = ["REPORTED", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

export const issueSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120, "Title is too long"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description is too long"),
  category: z.enum(ISSUE_CATEGORIES, { error: "Choose a category" }),
});

export const issueStatusSchema = z.object({
  status: z.enum(ISSUE_STATUSES, { error: "Choose a status" }),
});

export type IssueInput = z.infer<typeof issueSchema>;
