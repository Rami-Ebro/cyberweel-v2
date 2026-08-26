"use client";

import { createContext, useContext } from "react";
import type { ViewId } from "@/lib/site-data";
import { PUBLIC_PATH_VIEWS, publicViewPath } from "@/lib/public-navigation";

type NavContextValue = {
  view: ViewId;
  navigate: (v: ViewId) => void;
  openShortcuts: () => void;
};

export const NavContext = createContext<NavContextValue>({
  view: "home",
  navigate: () => {},
  openShortcuts: () => {},
});

export function useNav() {
  const context = useContext(NavContext);

  if (typeof window === "undefined" || PUBLIC_PATH_VIEWS[window.location.pathname]) {
    return context;
  }

  return {
    ...context,
    navigate: (view: ViewId) => {
      window.location.assign(publicViewPath(view, window.location.search));
    },
  };
}
