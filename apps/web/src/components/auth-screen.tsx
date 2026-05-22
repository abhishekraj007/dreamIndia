"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

export default function AuthScreen() {
  const [isSignIn, setIsSignIn] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      name: "" as string | undefined,
    },
    onSubmit: async ({ value }) => {
      if (isSignIn) {
        await authClient.signIn.email(
          {
            email: value.email,
            password: value.password,
          },
          {
            onSuccess: () => {
              router.push(redirectTo as any);
              toast.success("Welcome back!");
            },
            onError: (error) => {
              toast.error(error.error.message || "Failed to sign in");
            },
          },
        );
      } else {
        await authClient.signUp.email(
          {
            email: value.email,
            password: value.password,
            name: value.name || "",
          },
          {
            onSuccess: async () => {
              // Auto-login after successful sign up
              await authClient.signIn.email(
                {
                  email: value.email,
                  password: value.password,
                },
                {
                  onSuccess: () => {
                    router.push(redirectTo as any);
                    toast.success("Account created successfully!");
                  },
                  onError: (error) => {
                    toast.error(
                      "Account created but failed to sign in. Please sign in manually.",
                    );
                    setIsSignIn(true);
                  },
                },
              );
            },
            onError: (error) => {
              toast.error(error.error.message || "Failed to create account");
            },
          },
        );
      }
    },
    validators: {
      onSubmit: z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        name: isSignIn
          ? z.string().optional()
          : z.string().min(2, "Name must be at least 2 characters"),
      }),
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            {isSignIn ? "Welcome back" : "Create an account"}
          </CardTitle>
          <CardDescription>
            {isSignIn
              ? "Sign in to your account to continue"
              : "Get started with your new account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            {!isSignIn && (
              <form.Field name="name">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Name</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="text"
                      placeholder="John Doe"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {String(field.state.meta.errors[0])}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>
            )}

            <form.Field name="email">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Email</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    placeholder="name@example.com"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">
                      {String(field.state.meta.errors[0])}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Password</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    placeholder="••••••••"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">
                      {String(field.state.meta.errors[0])}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Subscribe>
              {(state) => (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!state.canSubmit || state.isSubmitting}
                >
                  {state.isSubmitting
                    ? "Loading..."
                    : isSignIn
                      ? "Sign In"
                      : "Create Account"}
                </Button>
              )}
            </form.Subscribe>
          </form>

          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => {
                setIsSignIn(!isSignIn);
                form.reset();
              }}
              className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
            >
              {isSignIn
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>

          <p className="px-8 text-center text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <a
              href="/terms"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Privacy Policy
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
