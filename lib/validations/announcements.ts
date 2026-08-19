import { z } from "zod";

export const ANNOUNCEMENT_PRIORITIES = ["NORMAL", "IMPORTANT", "URGENT"] as const;

export const announcementSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120, "Title is too long"),
  content: z
    .string()
    .trim()
    .min(10, "Content must be at least 10 characters")
    .max(5000, "Content is too long"),
  priority: z.enum(ANNOUNCEMENT_PRIORITIES, { error: "Choose a priority" }),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;
