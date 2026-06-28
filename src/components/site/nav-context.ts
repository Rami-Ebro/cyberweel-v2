"use client";

import { createContext, useContext } from "react";
import type { ViewId } from "@/lib/site-data";

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
  return useContext(NavContext);
}
