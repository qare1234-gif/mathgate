"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const routes: Record<string, string> = {
      principal: "/dashboard/principal",
      teacher: "/dashboard/teacher",
      student: "/dashboard/student",
    };
    router.replace(role ? routes[role] || "/login" : "/login");
  }, [router]);

  return null;
}
