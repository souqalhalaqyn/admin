import { isCancel } from "axios";
import { getApiClient } from "@/api";

export const UPLOAD_CANCELLED = "Upload cancelled";

function mapUploadError(error: unknown): Error {
  if (isCancel(error)) return new Error(UPLOAD_CANCELLED);
  const err = error as { response?: { status?: number }; code?: string };
  if (err.code === "ECONNABORTED") {
    return new Error("Upload timed out. The file may be too large or your connection is slow.");
  }
  if (err.response?.status === 413) {
    return new Error("File too large. Maximum size is 50MB.");
  }
  if (err.response?.status === 429) {
    return new Error("Too many uploads. Please wait a moment and try again.");
  }
  if (!err.response) {
    return new Error("Network error. Check your connection and try again.");
  }
  return new Error(`Upload failed (${err.response.status}). Please try again.`);
}

export function uploadFiles(
  formData: FormData,
  onProgress?: (percent: number) => void,
): { promise: Promise<string[]>; abort: () => void } {
  const client = getApiClient();
  const controller = new AbortController();

  const promise = client
    .post<{ data?: string[] }>("upload", formData, {
      signal: controller.signal,
      timeout: 120000,
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress(Math.min(100, Math.round((e.loaded / e.total) * 100)));
        }
      },
    })
    .then((res) => res.data?.data ?? [])
    .catch((error) => {
      throw mapUploadError(error);
    });

  return { promise, abort: () => controller.abort() };
}
