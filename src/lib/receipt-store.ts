import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const EXTENSIONS: Readonly<Record<string, string>> = {
  "image/png": "png",
  "image/webp": "webp",
};

export type ReceiptStore = {
  signUrls(paths: readonly string[]): Promise<Map<string, string>>;
  upload(trainingId: string, photo: File): Promise<string>;
  remove(path: string): Promise<void>;
};

export function createSupabaseReceiptStore(bucket = "receipts"): ReceiptStore {
  return {
    async signUrls(paths) {
      const links = new Map<string, string>();
      if (paths.length === 0) return links;
      const { data, error } = await createAdminClient()
        .storage.from(bucket)
        .createSignedUrls([...paths], 60 * 60);
      if (error) throw error;
      for (const link of data) {
        if (link.path && link.signedUrl) links.set(link.path, link.signedUrl);
      }
      return links;
    },
    async upload(trainingId, photo) {
      const extension = EXTENSIONS[photo.type] ?? "jpg";
      const path = `${trainingId}/${crypto.randomUUID()}.${extension}`;
      const { error } = await createAdminClient()
        .storage.from(bucket)
        .upload(path, photo, { contentType: photo.type });
      if (error) throw error;
      return path;
    },
    async remove(path) {
      const { error } = await createAdminClient().storage.from(bucket).remove([path]);
      if (error) throw error;
    },
  };
}

export const defaultReceiptStore = createSupabaseReceiptStore();
