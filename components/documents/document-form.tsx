"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createDocumentAction } from "@/lib/documents/actions";
import { initialActionState } from "@/lib/errors";
import { DOCUMENT_CATEGORIES } from "@/lib/validations/documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatEnumLabel } from "@/lib/utils";

export function DocumentForm({ cancelHref }: { cancelHref: string }) {
  const [state, formAction, pending] = useActionState(createDocumentAction, initialActionState);

  return (
    <form action={formAction} className="max-w-2xl space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required minLength={3} maxLength={120} placeholder="House rules 2026" />
        {state.fieldErrors?.title ? <p className="mt-1 text-sm text-danger">{state.fieldErrors.title}</p> : null}
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <Select id="category" name="category" defaultValue="RULES">
          {DOCUMENT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {formatEnumLabel(category)}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          name="description"
          rows={5}
          maxLength={2000}
          placeholder="What this file is and who should read it."
        />
        {state.fieldErrors?.description ? (
          <p className="mt-1 text-sm text-danger">{state.fieldErrors.description}</p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="file">File</Label>
        <Input
          id="file"
          name="file"
          type="file"
          required
          accept=".pdf,.txt,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,application/pdf,text/plain"
        />
        <p className="mt-1 text-xs text-muted">PDF, Word, Excel, text, or image. Up to 10MB.</p>
        {state.fieldErrors?.file ? <p className="mt-1 text-sm text-danger">{state.fieldErrors.file}</p> : null}
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
          {pending ? "Uploading..." : "Upload"}
        </Button>
      </div>
    </form>
  );
}
