"use client";

import { type Dispatch, type SetStateAction, useEffect, useState } from "react";

export function useDashboardMobileDrawer(
  open: boolean,
  setOpen: Dispatch<SetStateAction<boolean>>,
) {
  const [desktopSidebar, setDesktopSidebar] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      setDesktopSidebar(media.matches);
      if (media.matches) setOpen(false);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [setOpen]);

  useEffect(() => {
    if (!open || desktopSidebar) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [desktopSidebar, open, setOpen]);

  return { desktopSidebar };
}
