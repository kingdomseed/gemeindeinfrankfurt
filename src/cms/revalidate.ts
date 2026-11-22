import { revalidateTag } from "next/cache";
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  RequestContext,
} from "payload";

// The public church pages are built once and kept in Next.js's cache, along
// with what they read from Payload. Every read carries this tag, so a change
// to any page, announcement or site setting refreshes them all. The site is
// small enough that finding out exactly which pages changed is not worth it.
export const cmsCacheTag = "cms";

// The seed runs outside Next.js, where there is no cache to refresh; it sets
// this flag in the context of its writes.
export const skipRevalidate: RequestContext = { skipRevalidate: true };

function refresh(context: RequestContext) {
  if (context.skipRevalidate === true) return;
  // The next visit to each page still gets the old copy while the new one is
  // built, so a page never fails to load because the database is slow or
  // asleep. The change shows from the visit after that.
  revalidateTag(cmsCacheTag, "max");
}

export const revalidateAfterChange: CollectionAfterChangeHook = ({ context }) => {
  refresh(context);
};

export const revalidateAfterDelete: CollectionAfterDeleteHook = ({ context }) => {
  refresh(context);
};

export const revalidateGlobalAfterChange: GlobalAfterChangeHook = ({ context }) => {
  refresh(context);
};
