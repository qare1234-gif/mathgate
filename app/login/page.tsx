"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calculator, GraduationCap, BookOpen, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const roles = [
  {
    id: "principal",
    label: "원장님",
    desc: "전체 관리",
    icon: GraduationCap,
    selected: "bg-purple-600 text-white border-purple-600",
    hover: "hover:border-purple-400 hover:bg-purple-50",
    iconBg: "bg-purple-100 text-purple-600",
  },
  {
    id: "teacher",
    label: "선생님",
    desc: "수업 관리",
    icon: BookOpen,
    selected: "bg-blue-600 text-white border-blue-600",
    hover: "hover:border-blue-400 hover:bg-blue-50",
    iconBg: "bg-blue-100 text-blue-600",
  },
  {
    id: "student",
    label: "학생",
    desc: "내 시간표 · 학습 확인",
    icon: Users,
    selected: "bg-green-600 text-white border-green-600",
    hover: "hover:border-green-400 hover:bg-green-50",
    iconBg: "bg-green-100 text-green-600",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEnter = async () => {
    if (!selectedRole) return;
    setError("");

    if (selectedRole === "student") {
      if (!name.trim()) { setError("이름을 입력해 주세요."); return; }
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("students")
        .select("id, name")
        .eq("name", name.trim())
        .limit(1)
        .single();
      setLoading(false);
      if (!data) {
        setError("등록되지 않은 학생입니다. 선생님께 문의해 주세요.");
        return;
      }
      localStorage.setItem("userRole", "student");
      localStorage.setItem("userName", data.name);
      localStorage.setItem("studentId", data.id);
      router.push("/dashboard/student");
      return;
    }

    if (selectedRole === "teacher") {
      if (!name.trim()) { setError("이름을 입력해 주세요."); return; }
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("teachers")
        .select("id, name")
        .eq("name", name.trim())
        .limit(1)
        .single();
      setLoading(false);
      if (!data) {
        setError("등록되지 않은 선생님입니다. 원장님께 문의해 주세요.");
        return;
      }
      localStorage.setItem("userRole", "teacher");
      localStorage.setItem("userName", data.name);
      router.push("/dashboard/teacher");
      return;
    }

    // principal
    const userName = name.trim() || "원장님";
    localStorage.setItem("userRole", selectedRole);
    localStorage.setItem("userName", userName);
    router.push("/dashboard/principal");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-3xl shadow-lg mb-4">
            <Calculator className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">수학학원</h1>
          <p className="text-gray-500 mt-1">통합 관리 시스템</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-1 text-center">역할 선택</h2>
          <p className="text-sm text-gray-500 text-center mb-6">본인의 역할을 선택해 주세요</p>

          {/* Role buttons */}
          <div className="space-y-3 mb-6">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => { setSelectedRole(role.id); setError(""); }}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left",
                    isSelected ? role.selected : "border-gray-200 text-gray-700 bg-white " + role.hover
                  )}
                >
                  <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", isSelected ? "bg-white/20" : role.iconBg)}>
                    <Icon className={cn("w-5 h-5", isSelected ? "text-white" : "")} />
                  </div>
                  <div>
                    <p className="font-semibold text-base">{role.label}</p>
                    <p className={cn("text-sm", isSelected ? "text-white/80" : "text-gray-500")}>{role.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Name input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              이름
              {selectedRole === "principal" && <span className="text-gray-400 font-normal ml-1">(선택)</span>}
              {(selectedRole === "student" || selectedRole === "teacher") && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleEnter()}
              placeholder={selectedRole === "student" || selectedRole === "teacher" ? "등록된 이름을 정확히 입력하세요" : "이름을 입력하세요"}
              className={cn(
                "w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent",
                error ? "border-red-300 focus:ring-red-400" : "border-gray-200 focus:ring-blue-500"
              )}
            />
            {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
          </div>

          <button
            onClick={handleEnter}
            disabled={!selectedRole || loading}
            className={cn(
              "w-full py-3 rounded-xl font-semibold text-white transition-all duration-200",
              selectedRole && !loading ? "bg-blue-600 hover:bg-blue-700 shadow-md" : "bg-gray-300 cursor-not-allowed"
            )}
          >
            {loading ? "확인 중..." : "입장하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
