"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogIn, UserPlus } from "lucide-react";

interface AuthFormProps {
  onSuccess?: () => void;
}

// Validation schemas
const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const signUpSchema = z.object({
  username: z.string().min(1, "Username is required"),
  fullName: z.string().optional(),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password is too long"),
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

export function AuthForm({ onSuccess }: AuthFormProps) {
  const supabase = createClient();
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      password: "",
    },
  });

  const handleSignUp = async (data: SignUpFormData) => {
    setMessage(null);

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            full_name: data.fullName || data.username,
          },
          emailRedirectTo: `${window.location.origin}/chat`,
        },
      });

      if (error) throw error;

      if (authData.user) {
        setMessage({
          type: "success",
          text: "Account created! You can now sign in.",
        });
        signUpForm.reset();
        // Auto switch to sign in tab after 2 seconds
        setTimeout(() => {
          const signinTab = document.querySelector(
            '[value="signin"]'
          ) as HTMLButtonElement;
          signinTab?.click();
        }, 2000);
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to sign up",
      });
    }
  };

  const handleSignIn = async (data: SignInFormData) => {
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      // Success - close dialog and refresh
      if (onSuccess) {
        onSuccess();
      }
      // Refresh the page to load the authenticated state
      window.location.reload();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to sign in",
      });
    }
  };

  return (
    <Tabs defaultValue="signin" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin">
          <LogIn className="mr-2 h-4 w-4" />
          Sign In
        </TabsTrigger>
        <TabsTrigger value="signup">
          <UserPlus className="mr-2 h-4 w-4" />
          Sign Up
        </TabsTrigger>
      </TabsList>

      <TabsContent value="signin" className="mt-4">
        <form
          onSubmit={signInForm.handleSubmit(handleSignIn)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="signin-email">Email</Label>
            <Input
              id="signin-email"
              type="email"
              placeholder="you@example.com"
              disabled={signInForm.formState.isSubmitting}
              {...signInForm.register("email")}
            />
            {signInForm.formState.errors.email && (
              <p className="text-destructive text-sm">
                {signInForm.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="signin-password">Password</Label>
            <Input
              id="signin-password"
              type="password"
              placeholder="••••••"
              disabled={signInForm.formState.isSubmitting}
              {...signInForm.register("password")}
            />
            {signInForm.formState.errors.password && (
              <p className="text-destructive text-sm">
                {signInForm.formState.errors.password.message}
              </p>
            )}
          </div>
          {message && (
            <div
              className={`rounded-md p-3 text-sm ${
                message.type === "error"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400"
              }`}
            >
              {message.text}
            </div>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={signInForm.formState.isSubmitting}
          >
            {signInForm.formState.isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="signup" className="mt-4">
        <form
          onSubmit={signUpForm.handleSubmit(handleSignUp)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="johndoe"
              disabled={signUpForm.formState.isSubmitting}
              {...signUpForm.register("username")}
            />
            {signUpForm.formState.errors.username && (
              <p className="text-destructive text-sm">
                {signUpForm.formState.errors.username.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="full-name">Full Name (optional)</Label>
            <Input
              id="full-name"
              type="text"
              placeholder="John Doe"
              disabled={signUpForm.formState.isSubmitting}
              {...signUpForm.register("fullName")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="you@example.com"
              disabled={signUpForm.formState.isSubmitting}
              {...signUpForm.register("email")}
            />
            {signUpForm.formState.errors.email && (
              <p className="text-destructive text-sm">
                {signUpForm.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <Input
              id="signup-password"
              type="password"
              placeholder="••••••"
              disabled={signUpForm.formState.isSubmitting}
              {...signUpForm.register("password")}
            />
            {signUpForm.formState.errors.password && (
              <p className="text-destructive text-sm">
                {signUpForm.formState.errors.password.message}
              </p>
            )}
            <p className="text-muted-foreground text-xs">
              Minimum 6 characters
            </p>
          </div>
          {message && (
            <div
              className={`rounded-md p-3 text-sm ${
                message.type === "error"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400"
              }`}
            >
              {message.text}
            </div>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={signUpForm.formState.isSubmitting}
          >
            {signUpForm.formState.isSubmitting
              ? "Creating account..."
              : "Sign Up"}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}
