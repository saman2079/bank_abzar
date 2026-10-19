/** درایور ذخیره‌ی فایل. `put` آدرس عمومی فایل را برمی‌گرداند و همان آدرس در DB ذخیره می‌شود. */
export type StorageDriver = {
  put(key: string, data: Buffer, contentType: string): Promise<string>;
  remove(url: string): Promise<void>;
};
