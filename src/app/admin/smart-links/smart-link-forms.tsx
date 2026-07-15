"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createSmartLink,
  updateSmartLinkDestination,
  type SmartLinkActionState,
} from "./actions";

const initialSmartLinkActionState: SmartLinkActionState = {
  message: "",
  status: "idle",
};

function FormMessage({ state }: { state: SmartLinkActionState }) {
  if (state.status === "idle") return null;

  return (
    <p
      role="status"
      className={
        state.status === "success"
          ? "text-sm font-semibold text-emerald-700"
          : "text-sm font-semibold text-destructive"
      }
    >
      {state.message}
    </p>
  );
}

export function CreateSmartLinkForm() {
  const [state, action, pending] = useActionState(
    createSmartLink,
    initialSmartLinkActionState,
  );

  const formRef = useRef<HTMLFormElement>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");

  useEffect(() => {
    if (state.status === "success") {
      setTitle("");
      setSlug("");
      setDestinationUrl("");
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form ref={formRef} action={action} className="grid gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-ink">
          اسم الرابط
          <Input
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            autoComplete="off"
            required
          />
          <span className="text-xs font-normal text-muted-foreground">
            مثال: بطاقة العمل
          </span>
        </label>

        <label className="grid gap-2 text-sm font-bold text-ink">
          المعرّف المختصر
          <div
            dir="ltr"
            className="flex min-w-0 items-center rounded-md border border-input bg-white focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50"
          >
            <span className="border-r border-border px-3 text-sm text-muted-foreground">
              /r/
            </span>
            <Input
              name="slug"
              dir="ltr"
              value={slug}
              onChange={(event) => setSlug(event.target.value.toLowerCase())}
              className="border-0 bg-transparent shadow-none focus-visible:ring-0"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              autoComplete="off"
              required
            />
          </div>
          <span className="text-xs font-normal text-muted-foreground" dir="ltr">
            example: business-card
          </span>
        </label>
      </div>

      <label className="grid gap-2 text-sm font-bold text-ink">
        رابط الوجهة
        <Input
          name="destinationUrl"
          type="url"
          dir="ltr"
          value={destinationUrl}
          onChange={(event) => setDestinationUrl(event.target.value)}
          autoComplete="off"
          required
        />
        <span className="text-xs font-normal text-muted-foreground" dir="ltr">
          example: https://example.com
        </span>
      </label>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <FormMessage state={state} />
        <Button
          type="submit"
          disabled={pending}
          className="mr-auto min-w-36"
        >
          {pending ? <Loader2 className="animate-spin" /> : <Plus />}
          إنشاء الرابط
        </Button>
      </div>
    </form>
  );
}

export function EditDestinationForm({
  id,
  destinationUrl,
}: {
  id: string;
  destinationUrl: string;
}) {
  const [state, action, pending] = useActionState(
    updateSmartLinkDestination,
    initialSmartLinkActionState,
  );

  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="id" value={id} />
      <div dir="ltr" className="flex min-w-[18rem] gap-2">
        <Input
          name="destinationUrl"
          type="url"
          defaultValue={destinationUrl}
          aria-label="رابط الوجهة"
          required
        />
        <Button
          type="submit"
          size="icon"
          variant="outline"
          disabled={pending}
          aria-label="حفظ الوجهة"
          title="حفظ الوجهة"
        >
          {pending ? <Loader2 className="animate-spin" /> : <Save />}
        </Button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
