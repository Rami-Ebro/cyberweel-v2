"use client";

import { type ChangeEvent, type ComponentProps, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type DateInputProps = Omit<ComponentProps<"input">, "type">;

function inputValue(value: DateInputProps["value"] | DateInputProps["defaultValue"]) {
  return typeof value === "string" ? value : "";
}

function displayValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[1]}/${match[2]}/${match[3]}` : "YYYY/MM/DD";
}

function cyberweelToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Damascus",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value || "";
  const month = parts.find((part) => part.type === "month")?.value || "";
  const day = parts.find((part) => part.type === "day")?.value || "";
  return year && month && day ? `${year}-${month}-${day}` : "";
}

/** Keeps the native picker while presenting a stable year/month/day value. */
export function DateInput({ className, defaultValue, value, onChange, name, max, ...props }: DateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const controlled = value !== undefined;
  const paymentToday = name === "paidAt" ? cyberweelToday() : "";
  const effectiveDefaultValue = defaultValue ?? paymentToday;
  const effectiveMax = max ?? (paymentToday || undefined);
  const [localValue, setLocalValue] = useState(() => inputValue(value ?? effectiveDefaultValue));
  const currentValue = controlled ? inputValue(value) : localValue;

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form || controlled) return;
    const handleReset = () => {
      requestAnimationFrame(() => setLocalValue(inputRef.current?.value || inputValue(effectiveDefaultValue)));
    };
    form.addEventListener("reset", handleReset);
    return () => form.removeEventListener("reset", handleReset);
  }, [controlled, effectiveDefaultValue]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (!controlled) setLocalValue(event.currentTarget.value);
    onChange?.(event);
  }

  return (
    <span className="relative block">
      <span
        aria-hidden="true"
        dir="ltr"
        className={cn(
          "pointer-events-none absolute inset-y-0 right-4 z-10 flex items-center whitespace-nowrap text-left tabular-nums [unicode-bidi:isolate]",
          currentValue ? "text-inherit" : "text-slate-400",
        )}
      >
        {displayValue(currentValue)}
      </span>
      <input
        {...props}
        ref={inputRef}
        name={name}
        max={effectiveMax}
        type="date"
        lang="en-CA"
        dir="rtl"
        style={{ direction: "rtl" }}
        defaultValue={controlled ? undefined : inputValue(effectiveDefaultValue)}
        value={controlled ? currentValue : undefined}
        onChange={handleChange}
        className={cn(
          "w-full text-transparent caret-transparent [&::-webkit-datetime-edit]:text-transparent [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100",
          className,
        )}
      />
    </span>
  );
}
