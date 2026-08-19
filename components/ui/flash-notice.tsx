"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/toast";

const messages: Record<string, string> = {
  published: "Announcement published.",
  saved: "Announcement saved.",
  deleted: "Announcement deleted.",
  reported: "Issue reported.",
  status: "Issue status updated.",
  "vote-created": "Vote created. Residents have been notified.",
  voted: "Your vote has been recorded.",
  "document-uploaded": "Document uploaded.",
  "document-deleted": "Document deleted.",
};

export function FlashNotice() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { push } = useToast();
  const notice = searchParams.get("notice");
  const consumed = useRef<string | null>(null);

  useEffect(() => {
    if (!notice || !messages[notice]) {
      return;
    }

    const token = `${pathname}:${notice}`;
    if (consumed.current === token) {
      return;
    }

    consumed.current = token;
    push(messages[notice]);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("notice");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [notice, pathname, push, router, searchParams]);

  return null;
}
