"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: LoginState = { error: null };

const demos = [
  { role: "Manager", email: "manager@cityhome.mk", password: "Manager123!" },
  { role: "Admin", email: "admin@cityhome.mk", password: "Admin123!" },
  { role: "Resident", email: "resident@cityhome.mk", password: "Resident123!" },
];

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </Button>
      <div className="rounded-lg bg-card-muted p-3 text-xs text-muted">
        <p className="font-medium text-foreground">Demo accounts</p>
        <ul className="mt-2 space-y-1">
          {demos.map((demo) => (
            <li key={demo.email}>
              {demo.role}: {demo.email} / {demo.password}
            </li>
          ))}
        </ul>
      </div>
    </form>
  );
}
