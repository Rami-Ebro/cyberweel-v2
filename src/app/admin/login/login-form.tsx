"use client";

import { useActionState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginOwner, type LoginActionState } from "./actions";

const initialLoginActionState: LoginActionState = {
  message: "",
  status: "idle",
};

export function LoginForm() {
  const [state, action, pending] = useActionState(
    loginOwner,
    initialLoginActionState,
  );

  return (
    <form action={action} className="grid gap-5">
      <label className="grid gap-2 text-sm font-bold text-ink">
        البريد الإلكتروني
        <Input
          name="email"
          type="email"
          autoComplete="email"
          required
          dir="ltr"
        />
      </label>

      <label className="grid gap-2 text-sm font-bold text-ink">
        كلمة المرور
        <Input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          dir="ltr"
        />
      </label>

      {state.status === "error" ? (
        <p role="alert" className="text-sm font-semibold text-destructive">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <LogIn />}
        تسجيل الدخول
      </Button>
    </form>
  );
}
