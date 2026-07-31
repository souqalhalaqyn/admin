import { getApiClient } from "@/api";
import i18n from "@/i18n";

export async function uploadFiles(
  formData: FormData,
  onProgress?: (percent: number) => void,
): Promise<{ filenames: string[]; abort: () => void }> {
  const client = getApiClient();
  const url = (client.defaults.baseURL ?? "") + "upload";
  const token = client.defaults.headers.common.Authorization as string | undefined;

  let xhr: XMLHttpRequest;

  const promise = new Promise<string[]>((resolve, reject) => {
    xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.timeout = 120000;
    if (token) xhr.setRequestHeader("Authorization", token);
    xhr.setRequestHeader("Accept-Language", i18n.language === "ar" ? "ar" : "en");
    xhr.setRequestHeader("x-app", "admin");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.min(100, Math.round((e.loaded / e.total) * 100)));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          resolve((json?.data ?? []) as string[]);
        } catch {
          reject(new Error("Invalid server response"));
        }
      } else if (xhr.status === 413) {
        reject(new Error("File too large. Maximum size is 50MB."));
      } else if (xhr.status === 429) {
        reject(new Error("Too many uploads. Please wait a moment and try again."));
      } else if (xhr.status === 0) {
        reject(new Error("Network error. Check your connection and try again."));
      } else {
        reject(new Error(`Upload failed (${xhr.status}). Please try again.`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error. Check your connection and try again."));
    xhr.ontimeout = () => reject(new Error("Upload timed out. The file may be too large or your connection is slow."));

    xhr.send(formData);
  });

  return promise.then((filenames) => ({ filenames, abort: () => xhr!.abort() }));
}
