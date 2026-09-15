import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  image: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const notificationPreferencesSchema = z.object({
  productAlerts: z.boolean(),
  storeUpdates: z.boolean(),
  adPerformance: z.boolean(),
  productAnnouncements: z.boolean(),
});
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const defaultNotificationPreferences: NotificationPreferences = {
  productAlerts: true,
  storeUpdates: true,
  adPerformance: true,
  productAnnouncements: false,
};
