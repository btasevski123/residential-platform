"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createAnnouncementAction, updateAnnouncementAction } from "@/lib/announcements/actions";
import { initialActionState } from "@/lib/errors";
import { ANNOUNCEMENT_PRIORITIES } from "@/lib/validations/announcements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type AnnouncementFormProps = {
  cancelHref: string;
  announcement?: {
    id: string;
    title: string;
    content: string;
    priority: string;
  };
};

export function AnnouncementForm({ cancelHref, announcement }: AnnouncementFormProps) {
  const action = announcement
    ? updateAnnouncementAction.bind(null, announcement.id)
    : createAnnouncementAction;
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="max-w-2xl space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          defaultValue={announcement?.title}
          required
          minLength={3}
          maxLength={120}
        />
        {state.fieldErrors?.title ? (
          <p className="mt-1 text-sm text-danger">{state.fieldErrors.title}</p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          name="content"
          defaultValue={announcement?.content}
          required
          minLength={10}
          rows={8}
        />
        {state.fieldErrors?.content ? (
          <p className="mt-1 text-sm text-danger">{state.fieldErrors.content}</p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="priority">Priority</Label>
        <Select id="priority" name="priority" defaultValue={announcement?.priority ?? "NORMAL"}>
          {ANNOUNCEMENT_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priority.toLowerCase()}
            </option>
          ))}
        </Select>
      </div>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          href={cancelHref}
          className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? "Publishing..." : announcement ? "Save" : "Publish"}
        </Button>
      </div>
    </form>
  );
}
