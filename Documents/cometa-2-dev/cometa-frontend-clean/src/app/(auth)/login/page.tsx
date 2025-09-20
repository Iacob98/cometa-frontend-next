"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/hooks/use-auth";
import type { LoginRequest } from "@/types";

// Validation schema
const loginSchema = z.object({
  identifier: z.string().min(1, "Email or phone is required"),
  pin_code: z.string().min(4, "PIN must be at least 4 digits").max(6, "PIN must be at most 6 digits"),
  remember_me: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPin, setShowPin] = useState(false);
  const loginMutation = useLogin();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      pin_code: "",
      remember_me: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const loginRequest: LoginRequest = {
        pin_code: data.pin_code,
        remember_me: data.remember_me,
      };

      // Determine if identifier is email or phone
      if (data.identifier.includes("@")) {
        loginRequest.email = data.identifier;
      } else {
        loginRequest.phone = data.identifier;
      }

      await loginMutation.mutateAsync(loginRequest);
      // Redirect is handled in the mutation's onSuccess callback
    } catch (error) {
      // Error is handled by the mutation
      console.error("Login failed:", error);
    }
  };

  // Test user suggestions for quick login
  const testUsers = [
    { identifier: "admin@fiber.com", pin: "1234", role: "Admin" },
    { identifier: "pm1@fiber.com", pin: "5678", role: "Project Manager" },
    { identifier: "foreman1@fiber.com", pin: "9012", role: "Foreman" },
    { identifier: "worker1@fiber.com", pin: "7086", role: "Worker" },
    { identifier: "viewer1@fiber.com", pin: "3456", role: "Viewer" },
  ];

  const fillTestUser = (identifier: string, pin: string) => {
    form.setValue("identifier", identifier);
    form.setValue("pin_code", pin);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">COMETA</h1>
          <p className="text-sm text-gray-600">Fiber Optic Construction Management</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your email or phone number and PIN to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email or Phone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="admin@fiber.com or +1234567890"
                          type="text"
                          autoComplete="username"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pin_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PIN Code</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter 4-6 digit PIN"
                            type={showPin ? "text" : "password"}
                            autoComplete="current-password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPin(!showPin)}
                          >
                            {showPin ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Sign In
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Test Users */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-sm">Quick Test Login</CardTitle>
            <CardDescription className="text-xs">
              Click any user below to fill login form with test credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2">
            {testUsers.map((user) => (
              <Button
                key={user.identifier}
                variant="outline"
                size="sm"
                className="justify-between text-xs"
                onClick={() => fillTestUser(user.identifier, user.pin)}
              >
                <span>{user.role}</span>
                <span className="text-gray-500">{user.identifier}</span>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>COMETA v2.0 - Next.js Migration Phase 1</p>
          <p>© 2024 Fiber Optic Construction Management</p>
        </div>
      </div>
    </div>
  );
}