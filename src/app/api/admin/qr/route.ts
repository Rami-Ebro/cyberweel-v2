import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { NextRequest, NextResponse } from "next/server";
import { isOwnerSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function qrSourceUrl(targetUrl: string, format: "png" | "svg") {
  const params = new URLSearchParams({
    data: targetUrl,
   