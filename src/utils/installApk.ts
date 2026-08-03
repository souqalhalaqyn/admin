import Constants from "expo-constants";
import { File, Paths } from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import { Platform } from "react-native";

export async function downloadAndInstallApk(
  url: string,
  onProgress?: (fraction: number) => void,
): Promise<void> {
  if (Platform.OS !== "android") return;

  const filename = `update-${Date.now()}.apk`;
  const target = new File(Paths.cache, filename);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`download failed: HTTP ${response.status}`);
  }

  const total = Number(response.headers.get("Content-Length") ?? 0);
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("download stream unavailable");
  }

  const writer = target.writableStream().getWriter();
  let received = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (total > 0) onProgress?.(Math.min(1, received / total));
      await writer.write(value);
    }
    await writer.close();
  } finally {
    writer.releaseLock();
  }

  const packageName =
    Constants.platform?.android?.package ??
    Constants.expoConfig?.android?.package;

  const contentUri = `content://${packageName}.fileprovider/cache/${filename}`;

  await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
    data: contentUri,
    type: "application/vnd.android.package-archive",
    flags: 1,
  });
}
