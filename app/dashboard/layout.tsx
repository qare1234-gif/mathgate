"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Settings } from "lucide-react";
import { Profile } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Calculator,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const roleBadgeConfig = {
  principal: { label: "원장님", className: "bg-purple-100 text-purple-800 border-purple-200" },
  teacher: { label: "선생님", className: "bg-blue-100 text-blue-800 border-blue-200" },
  student: { label: "학생", className: "bg-green-100 text-green-800 border-green-200" },
};

const roleHomeRoutes = {
  principal: "/dashboard/principal",
  teacher: "/dashboard/teacher",
  student: "/dashboard/student",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const name = localStorage.getItem("userName");
    if (!role) {
      router.push("/login");
      return;
    }
    setProfile({ id: "", email: "", role: role as Profile["role"], name: name || role });
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    router.push("/login");
  };

  const navItems = [
    {
      href: profile ? roleHomeRoutes[profile.role] : "/dashboard",
      label: "대시보드",
      icon: LayoutDashboard,
      roles: ["principal", "teacher", "student"],
    },
    {
      href: "/schedule",
      label: "시간표",
      icon: Calendar,
      roles: ["principal", "teacher", "student"],
    },
    {
      href: "/progress",
      label: "학습 진도",
      icon: TrendingUp,
      roles: ["principal", "teacher", "student"],
    },
    {
      href: "/manage",
      label: "반·학생 관리",
      icon: Settings,
      roles: ["principal", "teacher"],
    },
  ].filter((item) => !profile || item.roles.includes(profile.role));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <Calculator className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  const badgeConfig = profile ? roleBadgeConfig[profile.role] : null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-30 transition-transform duration-300 flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:z-auto"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Calculator className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">수학학원</span>
          </div>
          <button
            className="ml-auto lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        {profile && (
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                {profile.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {profile.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{profile.email}</p>
              </div>
            </div>
            {badgeConfig && (
              <div className="mt-2">
                <span
                  className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                    badgeConfig.className
                  )}
                >
                  {badgeConfig.label}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-gray-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-100">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-gray-600 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            로그아웃
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Top header (mobile) */}
        <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-4">
          <button
            className="text-gray-600 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Calculator className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">수학학원</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
