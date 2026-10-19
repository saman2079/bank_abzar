import "server-only";
import { env } from "@/lib/env";
import { createBlobStorage } from "./blob";
import { createLocalStorage } from "./local";
import type { StorageDriver } from "./types";

export const storage: StorageDriver =
  env.STORAGE_DRIVER === "blob" ? createBlobStorage(env.BLOB_READ_WRITE_TOKEN ?? "") : createLocalStorage();
