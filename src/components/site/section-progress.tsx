"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Section = {
  id: string;
  label: string;
  dark?: boolean;
};

/**
 * A quiet, fixed right-rail section progress indicator for long pages.
 * Shows the current section and lets users jump by clicking.
