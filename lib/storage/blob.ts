import "server-only";
import type { StorageDriver } from "./types";

/** فقط وقتی `STORAGE_DRIVER=blob` است import می‌شود؛ نیازمند `npm i @vercel/blob`. */
export function createBlobStorage(token: string): StorageDriver {
  return {
    async put(key, data, contentType) {
      const { put } = await import("@vercel/blob");
      const blob = await put(key, data, { access: "public", contentType, token, addRandomSuffix: false });

      return blob.url;
    },

    async remove(url) {
      const { del } = await import("@vercel/blob");
      await del(url, { token });
    },
  };
}
