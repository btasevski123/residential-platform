import { z } from "zod";

export const MAX_VOTE_OPTIONS = 8;

const optionSchema = z
  .string()
  .trim()
  .min(1, "Option cannot be empty")
  .max(80, "Option is too long");

export const createVoteSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(120, "Title is too long"),
    description: z
      .string()
      .trim()
      .min(10, "Description must be at least 10 characters")
      .max(5000, "Description is too long"),
    startsAt: z.coerce.date({ error: "Choose a start date" }),
    endsAt: z.coerce.date({ error: "Choose an end date" }),
    options: z.array(optionSchema).min(2, "Add at least two options").max(MAX_VOTE_OPTIONS, "You can add up to 8 options"),
  })
  .superRefine((data, ctx) => {
    if (Number.isNaN(data.startsAt.getTime())) {
      ctx.addIssue({ code: "custom", path: ["startsAt"], message: "Choose a start date" });
    }
    if (Number.isNaN(data.endsAt.getTime())) {
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "Choose an end date" });
    }
    if (data.endsAt <= data.startsAt) {
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "End must be after start" });
    }
    if (data.endsAt <= new Date()) {
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "End must be in the future" });
    }

    const labels = data.options.map((option) => option.toLowerCase());
    if (new Set(labels).size !== labels.length) {
      ctx.addIssue({ code: "custom", path: ["options"], message: "Options must be unique" });
    }
  });

export const castVoteSchema = z.object({
  optionId: z.string().trim().min(1, "Choose an option"),
});

export type CreateVoteInput = z.infer<typeof createVoteSchema>;
export type CastVoteInput = z.infer<typeof castVoteSchema>;
