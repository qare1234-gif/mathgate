"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Users, Calendar, TrendingUp, ArrowRight } from "lucide-react";

const DAY_NAMES = ["월", "화", "수", "목", "금", "토", "일"];

export default function TeacherDashboard() {
  const router = useRouter();
  const [name, setName] = useState("선생님");
  const [classes, setClasses] = useState<any[]>([]);
  const [todaySchedules, setTodaySchedules] = useState<any[]>([]);
  const [progressList, setProgressList] = useState<any[]>([]);
  const todayIndex = (new Date().getDay() + 6) % 7;

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "teacher") { router.push("/login"); return; }
    setName(localStorage.getItem("userName") || "선생님");

    const supabase = createClient();

    Promise.all([
      supabase.from("classes").select("*").order("name"),
      supabase.from("schedules").select("*, classes(name)").eq("day_of_week", todayIndex).order("start_time"),
      supabase.from("progress").select("*, classes(name)").order("updated_at", { ascending: false }).limit(6),
    ]).then(([cls, sched, prog]) => {
      setClasses(cls.data ?? []);
      setTodaySchedules(sched.data ?? []);
      setProgressList(prog.data ?? []);
    });
  }, [router, todayIndex]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">안녕하세요, {name} 선생님!</h1>
        <p className="text-gray-500 mt-1">오늘도 즐거운 수업 되세요.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link href="/schedule">
          <Card className="border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">시간표</p>
                    <p className="text-xs text-gray-500">주간 수업 일정</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-400" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/progress">
          <Card className="border border-emerald-100 bg-gradient-to-br from-emerald-50 to-green-50 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">학습 진도</p>
                    <p className="text-xs text-gray-500">진도 및 학생 관리</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">반 목록 ({classes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {classes.length > 0 ? (
              <div className="space-y-3">
                {classes.map((cls) => (
                  <div key={cls.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="font-medium text-gray-900 text-sm">{cls.name}</p>
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

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">오늘의 수업 ({DAY_NAMES[todayIndex]}요일)</CardTitle>
          </CardHeader>
          <CardContent>
            {todaySchedules.length > 0 ? (
              <div className="space-y-3">
                {todaySchedules.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{s.classes?.name ?? "반 없음"}</p>
                      <p className="text-xs text-indigo-600">{s.start_time.slice(0, 5)} ~ {s.end_time.slice(0, 5)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">오늘 수업이 없습니다</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">학습 진도 현황</CardTitle>
              <Link href="/progress"><Button variant="ghost" size="sm" className="text-blue-600">전체 보기</Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            {progressList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {progressList.map((prog: any) => {
                  const rate = prog.progress_rate ?? 0;
                  const colorClass = rate >= 70 ? "bg-green-500" : rate >= 40 ? "bg-yellow-500" : "bg-red-500";
                  const textColor = rate >= 70 ? "text-green-600" : rate >= 40 ? "text-yellow-600" : "text-red-600";
                  return (
                    <div key={prog.id} className="p-3 rounded-lg border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{prog.classes?.name ?? "반 없음"}</p>
                          {prog.unit_name && <p className="text-xs text-gray-500">{prog.unit_name}{prog.chapter && ` - ${prog.chapter}`}</p>}
                        </div>
                        <span className={`text-sm font-bold ${textColor}`}>{rate}%</span>
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
