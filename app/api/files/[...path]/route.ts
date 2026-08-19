import { notFound } from "next/navigation";
import { readFile } from "node:fs/promises";
import { getAccessContext } from "@/lib/auth/current-user";
import { getIssueByImageUrl, storedImageKey } from "@/lib/issues/service";
import { storage } from "@/lib/storage";

function contentTypeFromKey(key: string) {
  if (key.endsWith(".png")) return "image/png";
  if (key.endsWith(".webp")) return "image/webp";
  if (key.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const ctx = await getAccessContext();
  if (!ctx) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { path } = await context.params;
  const key = path.join("/");
  const imageUrl = `/api/files/${key}`;
  const issue = await getIssueByImageUrl(ctx, imageUrl);

  if (!issue || storedImageKey(issue.imageUrl ?? "") !== key) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const file = await readFile(storage.absolutePath(key));
    return new Response(file, {
      headers: {
        "Content-Type": contentTypeFromKey(key),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    notFound();
  }
}
