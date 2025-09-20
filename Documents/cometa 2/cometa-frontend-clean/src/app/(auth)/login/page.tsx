"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLogin } from "@/hooks/use-auth";
import { loginSchema, LoginFormData } from "@/lib/validations/auth";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

// Quick login test users for development
const TEST_USERS = [
  { email: "admin@fiber.com", pin: "1234", role: "Admin" },
  { email: "pm1@fiber.com", pin: "1234", role: "Project Manager" },
  { email: "foreman1@fiber.com", pin: "1234", role: "Foreman" },
  { email: "worker1@fiber.com", pin: "1234", role: "Worker" },
  { email: "viewer1@fiber.com", pin: "1234", role: "Viewer" },
];

export default function LoginPage() {
  const [showPin, setShowPin] = useState(false);
  const loginMutation = useLogin();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      pin_code: "",
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const handleQuickLogin = (email: string, pin: string) => {
    form.setValue("email", email);
    form.setValue("pin_code", pin);
    loginMutation.mutate({ email, pin_code: pin });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">COMETA</h1>
          <p className="text-gray-600 mt-2">Fiber Optic Construction Management</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your email and PIN code to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          {...field}
                          disabled={loginMutation.isPending}
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
                            type={showPin ? "text" : "password"}
                            placeholder="Enter your PIN"
                            {...field}
                            disabled={loginMutation.isPending}
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
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </Form>

            {/* Quick Login for Development */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-600 mb-3">Quick Login (Development):</p>
                <div className="grid grid-cols-1 gap-2">
                  {TEST_USERS.map((user) => (
                    <Button
                      key={user.email}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickLogin(user.email, user.pin)}
                      disabled={loginMutation.isPending}
                      className="justify-start text-left"
                    >
                      <div>
                        <div className="font-medium">{user.role}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>© 2025 COMETA. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}