"use client";

import { useActionState } from "react";
import { updateNotificationPreferencesAction } from "@/lib/notifications/actions";
import { initialActionState } from "@/lib/errors";
import { Button } from "@/components/ui/button";

export function NotificationPreferencesForm({
  emailEnabled,
  pushEnabled,
  pushAvailable,
  returnTo = "/settings",
}: {
  emailEnabled: boolean;
  pushEnabled: boolean;
  pushAvailable: boolean;
  returnTo?: "/settings" | "/profile";
}) {
  const [state, formAction, pending] = useActionState(
    updateNotificationPreferencesAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="returnTo" value={returnTo} />
      <label className="flex items-start gap-3 rounded-lg border border-border px-4 py-3">
        <input type="hidden" name="emailNotificationsEnabled" value="false" />
        <input
          type="checkbox"
          name="emailNotificationsEnabled"
          value="true"
          defaultChecked={emailEnabled}
          className="mt-1 size-4 accent-accent"
        />
        <span>
          <span className="block text-sm font-medium">Email</span>
          <span className="text-sm text-muted">
            Send the same alerts to your email when you are not in the app.
          </span>
        </span>
      </label>
      <label className="flex items-start gap-3 rounded-lg border border-border px-4 py-3">
        <input type="hidden" name="pushNotificationsEnabled" value="false" />
        <input
          type="checkbox"
          name="pushNotificationsEnabled"
          value="true"
          defaultChecked={pushEnabled}
          className="mt-1 size-4 accent-accent"
        />
        <span>
          <span className="block text-sm font-medium">Browser push</span>
          <span className="text-sm text-muted">
            {pushAvailable
              ? "Ask this browser for permission and show alerts even when NIVIA is closed."
              : "Push is not configured on this server yet. Email still works."}
          </span>
        </span>
      </label>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save preferences"}
      </Button>
    </form>
  );
}
