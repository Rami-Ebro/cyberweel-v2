"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteSmartLink } from "./actions";

export function DeleteSmartLinkButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  return (
    <form
      action={deleteSmartLink}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `هل أنت متأكد من حذف الرابط «${title}»؟\n\nسيُحذف الرابط وجميع سجلات زياراته نهائيًا، ولا يمكن التراجع عن ذلك.`,
        );

        if (!confirmed) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        size="sm"
        variant="outline"
        className="border-destructive/30 text-destructive hover:bg-destructive hover:text-white"
      >
        <Trash2 />
        حذف
      </Button>
    </form>
  );
}
