"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createIssueAction } from "@/lib/issues/actions";
import { initialActionState } from "@/lib/errors";
import { ISSUE_CATEGORIES } from "@/lib/validations/issues";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatEnumLabel } from "@/lib/utils";

export function IssueForm() {
  const [state, formAction, pending] = useActionState(createIssueAction, initialActionState);

  return (
    <form action={formAction} className="max-w-2xl space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required minLength={3} maxLength={120} placeholder="Elevator not working" />
        {state.fieldErrors?.title ? (
          <p className="mt-1 text-sm text-danger">{state.fieldErrors.title}</p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <Select id="category" name="category" defaultValue="GENERAL">
          {ISSUE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {formatEnumLabel(category)}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          required
          minLength={10}
          rows={7}
          placeholder="What happened, where, and when?"
        />
        {state.fieldErrors?.description ? (
          <p className="mt-1 text-sm text-danger">{state.fieldErrors.description}</p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="photo">Photo (optional)</Label>
        <Input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
        <p className="mt-1 text-xs text-muted">JPEG, PNG, WebP or GIF. Up to 5MB.</p>
      </div>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          href="/issues"
          className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </form>
  );
}
