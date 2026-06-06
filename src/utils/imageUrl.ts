import { SERVER_URL } from "@/config/constants";

export function buildImageUrl(filename?: string | null): string {
  if (!filename) return "";
  if (filename.startsWith("http://") || filename.startsWith("https://")) return filename;
  return `${SERVER_URL}/uploads/${filename}`;
}
