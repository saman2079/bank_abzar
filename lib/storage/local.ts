import "server-only";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";
import type { StorageDriver } from "./types";

export const LOCAL_URL_PREFIX = "/uploads/";

function uploadRoot(): string {
  return path.resolve(env.UPLOAD_DIR);
}

/** مسیر امن روی دیسک برای بخش‌های URL؛ اگر خارج از ریشه برود یا نامعتبر باشد `null`. */
export function resolveLocalPath(segments: string[]): string | null {
  if (segments.length === 0) return null;
  if (!segments.every((part) => /^[A-Za-z0-9._-]+$/.test(part) && part !== "." && part !== "..")) return null;

  const root = uploadRoot();
  const absolute = path.join(root, ...segments);

  return absolute.startsWith(root + path.sep) ? absolute : null;
}

export function createLocalStorage(): StorageDriver {
  return {
    async put(key, data) {
      const absolute = resolveLocalPath(key.split("/"));
      if (!absolute) throw new Error("invalid storage key");

      await mkdir(path.dirname(absolute), { recursive: true });
      await writeFile(absolute, data);

      return `${LOCAL_URL_PREFIX}${key}`;
    },

    async remove(url) {
      if (!url.startsWith(LOCAL_URL_PREFIX)) return;
      const absolute = resolveLocalPath(url.slice(LOCAL_URL_PREFIX.length).split("/"));
      if (absolute) await rm(absolute, { force: true });
    },
  };
}
