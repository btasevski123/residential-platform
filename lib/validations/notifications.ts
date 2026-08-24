import { z } from "zod";

export const notificationPreferencesSchema = z.object({
  emailNotificationsEnabled: z.boolean(),
  pushNotificationsEnabled: z.boolean(),
});

export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
