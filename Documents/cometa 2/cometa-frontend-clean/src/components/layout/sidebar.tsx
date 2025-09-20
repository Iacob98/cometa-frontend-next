"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCurrentUser, useLogout } from "@/hooks/use-auth";
import {
  Home,
  FolderOpen,
  Users,
  ClipboardList,
  Package,
  Euro,
  BarChart3,
  Truck,
  Settings,
  LogOut,
  Construction,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    roles: ["admin", "pm", "foreman", "crew", "viewer", "worker"],
  },
  {
    name: "Projects",
    href: "/dashboard/projects",
    icon: FolderOpen,
    roles: ["admin", "pm", "foreman", "viewer"],
  },
  {
    name: "Work Entries",
    href: "/dashboard/work-entries",
    icon: ClipboardList,
    roles: ["admin", "pm", "foreman", "crew", "worker"],
  },
  {
    name: "Teams",
    href: "/dashboard/teams",
    icon: Users,
    roles: ["admin", "pm", "foreman"],
  },
  {
    name: "Materials",
    href: "/dashboard/materials",
    icon: Package,
    roles: ["admin", "pm", "foreman"],
  },
  {
    name: "Financial",
    href: "/dashboard/financial",
    icon: Euro,
    roles: ["admin", "pm"],
  },
  {
    name: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    roles: ["admin", "pm", "foreman", "viewer"],
  },
  {
    name: "Equipment",
    href: "/dashboard/equipment",
    icon: Truck,
    roles: ["admin", "pm", "foreman"],
  },
  {
    name: "Project Preparation",
    href: "/dashboard/project-preparation",
    icon: Construction,
    roles: ["admin", "pm"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();

  const filteredNavigation = navigation.filter((item) =>
    user?.role ? item.roles.includes(user.role) : false
  );

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-700">
        <div className="flex items-center">
          <Construction className="h-8 w-8 text-blue-400" />
          <span className="ml-2 text-xl font-bold">COMETA</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-gray-700 p-4">
        {user && (
          <div className="flex items-center mb-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate capitalize">{user.role}</p>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <Link
            href="/dashboard/settings"
            className="group flex items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
          >
            <Settings className="mr-3 h-5 w-5 text-gray-400 group-hover:text-white" />
            Settings
          </Link>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-gray-300 hover:bg-gray-700 hover:text-white"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}