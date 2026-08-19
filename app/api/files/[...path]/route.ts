import { notFound } from "next/navigation";
import { readFile } from "node:fs/promises";
import { getAccessContext } from "@/lib/auth/current-user";
import { getIssueByImageUrl, storedImageKey } from "@/lib/issues/service";
import { getDocumentByFileUrl } from "@/lib/documents/service";
import { fileKeyFromUrl, storage } from "@/lib/storage";

function contentTypeFromKey(key: string) {
  const extension = key.split(".").pop()?.toLowerCase();
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";
  if (extension === "pdf") return "application/pdf";
  if (extension === "txt") return "text/plain";
  if (extension === "doc") return "application/msword";
  if (extension === "docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (extension === "xls") return "application/vnd.ms-excel";
  if (extension === "xlsx") {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  return "application/octet-stream";
}

function contentDisposition(fileName: string, inline: boolean) {
  const safe = fileName.replace(/[\r\n"]/g, "_");
  const type = inline ? "inline" : "attachment";
  return `${type}; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

async function serveStoredFile(key: string, mimeType: string, fileName?: string) {
  const file = await readFile(storage.absolutePath(key));
  const inline = mimeType.startsWith("image/") || mimeType === "application/pdf" || mimeType === "text/plain";
  const headers: Record<string, string> = {
    "Content-Type": mimeType,
    "Cache-Control": "private, max-age=3600",
  };

  if (fileName) {
    headers["Content-Disposition"] = contentDisposition(fileName, inline);
  }

  return new Response(file, { headers });
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
  const fileUrl = `/api/files/${key}`;

  const issue = await getIssueByImageUrl(ctx, fileUrl);
  if (issue && storedImageKey(issue.imageUrl ?? "") === key) {
    try {
      return await serveStoredFile(key, contentTypeFromKey(key));
    } catch {
      notFound();
    }
  }

  const document = await getDocumentByFileUrl(ctx, fileUrl);
  if (document && fileKeyFromUrl(document.fileUrl) === key) {
    try {
      return await serveStoredFile(
        key,
        document.mimeType || contentTypeFromKey(key),
        document.fileName,
      );
    } catch {
      notFound();
    }
  }

  return new Response("Not found", { status: 404 });
}
