"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, BRAND, type ViewId } from "@/lib/site-data";
import { useNav } from