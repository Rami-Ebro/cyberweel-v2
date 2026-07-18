"use client";

import { useEffect } from "react";

const SKIP_TAGS = new Set([
  "A",
  "CODE",
  "PRE",
  "SCRIPT",
  "STYLE",
  "TEXTAREA",
  "INPUT",
  "OPTION",
]);

function cleanTextNode(node: Text) {
  const parent = node.parentElement;
  if (!parent || SKIP_TAGS.has(parent.tagName)) return;

  const value = node.nodeValue;
  if (!value) return;

  const trimmed = value.trimEnd();
  if (!trimmed.endsWith(".") || trimmed.endsWith("..")) return;

  const visibleText = parent.textContent ?? "";
  if (
    visibleText.includes("@") ||
    visibleText.includes("http://") ||
    visibleText.includes("https://") ||
    /\d+\.\d+$/.test(trimmed)
  ) {
    return;
  }

  const trailingWhitespace = value.slice(trimmed.length);
  node.nodeValue = `${trimmed.slice(0, -1)}${trailingWhitespace}`;
}

function cleanTree(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    cleanTextNode(root as Text);
    return;
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    cleanTextNode(current as Text);
    current = walker.nextNode();
  }
}

export function TrailingPeriodCleaner() {
  useEffect(() => {
    cleanTree(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(cleanTree);
        if (mutation.type === "characterData") cleanTree(mutation.target);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
