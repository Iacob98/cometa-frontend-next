"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Users,
  ClipboardList,
  Package,
  Truck,
  BarChart3,
  Settings,
  Home,
  ChevronDown,
  ChevronRight,
  FileText,
  Calendar,
  Activity,
  Bell,
  Map,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePermissions } from "@/hooks/use-auth";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  children?: NavItem[];
  roles?: string[];
}

const navigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Projects",
    href: "/dashboard/projects",
    icon: Building2,
    children: [
      {
        title: "All Projects",
        href: "/dashboard/projects",
        icon: Building2,
      },
      {
        title: "Create Project",
        href: "/dashboard/projects/new",
        icon: Building2,
        roles: ["admin", "pm"],
      },
    ],
  },
  {
    title: "Work Entries",
    href: "/dashboard/work-entries",
    icon: ClipboardList,
    badge: "12",
  },
  {
    title: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
  },
  {
    title: "Teams",
    href: "/dashboard/teams",
    icon: Users,
    roles: ["admin", "pm", "foreman"],
  },
  {
    title: "Materials",
    href: "/dashboard/materials",
    icon: Package,
    roles: ["admin", "pm"],
  },
  {
    title: "Equipment",
    href: "/dashboard/equipment",
    icon: Truck,
    roles: ["admin", "pm"],
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    roles: ["admin", "pm", "viewer"],
  },
  {
    title: "Financial",
    href: "/dashboard/financial",
    icon: DollarSign,
    roles: ["admin", "pm"],
  },
  {
    title: "Activity Log",
    href: "/dashboard/activities",
    icon: Activity,
    roles: ["admin", "pm"],
  },
  {
    title: "Calendar",
    href: "/dashboard/calendar",
    icon: Calendar,
  },
  {
    title: "Documents",
    href: "/dashboard/documents",
    icon: FileText,
  },
  {
    title: "Geospatial",
    href: "/dashboard/geospatial",
    icon: Map,
    roles: ["admin", "pm", "foreman"],
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["admin"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { hasAnyRole } = usePermissions();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href)
        ? prev.filter((item) => item !== href)
        : [...prev, href]
    );
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const canAccessItem = (item: NavItem) => {
    if (!item.roles) return true;
    return hasAnyRole(item.roles);
  };

  const filteredNavigation = navigation.filter(canAccessItem);

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex-1 overflow-auto py-2">
        <nav className="space-y-1 px-2">
          {filteredNavigation.map((item) => (
            <div key={item.href}>
              {item.children ? (
                <>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-between",
                      isActive(item.href) && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => toggleExpanded(item.href)}
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.title}
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    {expandedItems.includes(item.href) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  {expandedItems.includes(item.href) && (
                    <div className="ml-4 space-y-1">
                      {item.children
                        .filter(canAccessItem)
                        .map((child) => (
                          <Link key={child.href} href={child.href}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "w-full justify-start",
                                isActive(child.href) && "bg-accent text-accent-foreground"
                              )}
                            >
                              <child.icon className="mr-2 h-4 w-4" />
                              {child.title}
                            </Button>
                          </Link>
                        ))}
                    </div>
                  )}
                </>
              ) : (
                <Link href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start",
                      isActive(item.href) && "bg-accent text-accent-foreground"
                    )}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          <p>COMETA v2.0</p>
          <p>Phase 1 Migration</p>
        </div>
      </div>
    </div>
  );
}