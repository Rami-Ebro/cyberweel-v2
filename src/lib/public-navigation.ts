import type { ViewId } from "@/lib/site-data";

export const PUBLIC_VIEW_PATHS: Record<ViewId, string> = {
  home: "/",
  "how-we-help": "/how-we-help",
  "share-challenge": "/share-challenge",
  partner: "/partner",
  about: "/about",
  contact: "/contact-us",
};

export const PUBLIC_PATH_VIEWS = Object.entries(PUBLIC_VIEW_PATHS).reduce<Record<string, ViewId>>(
  (acc, [view, path]) => {
    acc[path] = view as ViewId;
    return acc;
  },
  {},
);

export function publicViewPath(view: ViewId, search = "") {
  return `${PUBLIC_VIEW_PATHS[view]}${search}`;
}
