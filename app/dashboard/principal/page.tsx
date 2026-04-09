"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, GraduationCap, Calendar, TrendingUp, ArrowRight } from "lucide-react";

export default function PrincipalDashboard() {
  const router = useRouter();
  const [name, setName] = useState("원장님");
  const [stats, setStats] = useState({ classes: 0, teachers: 0, students: 0 });
  const [classes, setClasses] = useState<any[]>([]);
  const [progressList, setProgressList] = useState<any[]>([]);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "principal") { router.push("/login"); return; }
    setName(localStorage.getItem("userName") || "원장님");

    const supabase = createClient();

    Promise.all([
      supabase.from("classes").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
      supabase.from("classes").select("*, profiles(name)").order("created_at", { ascending: false }).limit(5),
      supabase.from("progress").select("*, classes(name)").order("updated_at", { ascending: false }).limit(5),
    ]).then(([c, t, s, cls, prog]) => {
      setStats({ classes: c.count ?? 0, teachers: t.count ?? 0, students: s.count ?? 0 });
      setClasses(cls.data ?? []);
      setProgressList(prog.data ?? []);
    });
  }, [router]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">안녕하세요, {name} 원장님!</h1>
        <p className="text-gray-500 mt-1">수학학원 현황을 한눈에 확인하세요.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "총 반 수", value: stats.classes, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "총 선생님 수", value: stats.teachers, icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "총 학생 수", value: stats.students, icon: Users, color: "text-green-600", bg: "bg-green-50" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{s.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{s.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link href="/schedule">
          <Card className="border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">시간표 관리</p>
                    <p className="text-sm text-gray-500">주간 시간표 확인 및 편집</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-indigo-400" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/progress">
          <Card className="border border-emerald-100 bg-gradient-to-br from-emerald-50 to-green-50 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">학습 진도 현황</p>
                    <p className="text-sm text-gray-500">전체 반 학습 진도 확인</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classes */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">반 목록</CardTitle>
              <Link href="/schedule"><Button variant="ghost" size="sm" className="text-blue-600">전체 보기</Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            {classes.length > 0 ? (
              <div className="space-y-3">
                {classes.map((cls: any) => (
                  <div key={cls.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{cls.name}</p>
                      <p className="text-xs text-gray-500">담당: {cls.profiles?.name ?? "미배정"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">등록된 반이 없습니다</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">학습 진도 현황</CardTitle>
              <Link href="/progress"><Button variant="ghost" size="sm" className="text-blue-600">전체 보기</Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            {progressList.length > 0 ? (
              <div className="space-y-4">
                {progressList.map((prog: any) => {
                  const rate = prog.progress_rate ?? 0;
                  const colorClass = rate >= 70 ? "bg-green-500" : rate >= 40 ? "bg-yellow-500" : "bg-red-500";
                  const textColor = rate >= 70 ? "text-green-600" : rate >= 40 ? "text-yellow-600" : "text-red-600";
                  return (
                    <div key={prog.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{prog.classes?.name ?? "반 없음"}</span>
                        <span className={`text-xs font-semibold ${textColor}`}>{rate}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${colorClass}`} style={{ width: `${rate}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">등록된 진도가 없습니다</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
