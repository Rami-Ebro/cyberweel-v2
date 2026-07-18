"use client";

import { useState } from "react";
import { Share2, Check, Link2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ViewId } from "@/lib/site-data";
import { useI18n } from "@/components/site/i18n";

/**
 * Quiet "share this page" action.
 * Uses the native Web Share API where available