"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);

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
        <div className="relative">
          <Input
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            dir="ltr"
            className="pl-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-ink"
            aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
          >
            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
      </label>

      <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
        <input
          name="remember"
          type="checkbox"
          className="size-4 rounded border-input accent-current"
        />
        تذكّرني لمدة 30 يومًا
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
