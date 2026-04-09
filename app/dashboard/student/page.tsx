"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Calendar, TrendingUp, ArrowRight } from "lucide-react";

const DAY_NAMES = ["월", "화", "수", "목", "금", "토", "일"];

export default function StudentDashboard() {
  const router = useRouter();
  const [name, setName] = useState("학생");
  const [myClasses, setMyClasses] = useState<any[]>([]);
  const [todaySchedules, setTodaySchedules] = useState<any[]>([]);
  const [progressList, setProgressList] = useState<any[]>([]);
  const todayIndex = (new Date().getDay() + 6) % 7;

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const studentId = localStorage.getItem("studentId");
    if (role !== "student" || !studentId) { router.push("/login"); return; }
    setName(localStorage.getItem("userName") || "학생");

    const supabase = createClient();

    // 내 반 목록 조회
    supabase
      .from("class_students")
      .select("class_id, classes(id, name, teacher_name)")
      .eq("student_id", studentId)
      .then(({ data }) => {
        const classes = (data ?? []).map((d: any) => d.classes).filter(Boolean);
        setMyClasses(classes);
        const classIds = classes.map((c: any) => c.id);
        if (classIds.length === 0) return;

        // 내 반의 오늘 시간표
        supabase
          .from("schedules")
          .select("*, classes(name)")
          .in("class_id", classIds)
          .eq("day_of_week", todayIndex)
          .order("start_time")
          .then(({ data: sched }) => setTodaySchedules(sched ?? []));

        // 내 반의 학습 진도
        supabase
          .from("progress")
          .select("*, classes(name)")
          .in("class_id", classIds)
          .order("updated_at", { ascending: false })
          .then(({ data: prog }) => setProgressList(prog ?? []));
      });
  }, [router, todayIndex]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">안녕하세요, {name}!</h1>
        <p className="text-gray-500 mt-1">오늘도 열심히 공부해요!</p>
      </div>

      {/* 내 수강반 */}
      {myClasses.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {myClasses.map((cls: any) => (
            <span key={cls.id} className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-sm px-3 py-1.5 rounded-full font-medium">
              <BookOpen className="w-3.5 h-3.5" />
              {cls.name}
              {cls.teacher_name && <span className="text-blue-400 text-xs">· {cls.teacher_name}</span>}
            </span>
          ))}
        </div>
      )}

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
                    <p className="font-semibold text-gray-900 text-sm">내 시간표</p>
                    <p className="text-xs text-gray-500">내 수업 일정 확인</p>
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
                    <p className="text-xs text-gray-500">내 진도 및 숙제 확인</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 오늘 시간표 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">오늘의 수업 ({DAY_NAMES[todayIndex]}요일)</CardTitle>
          </CardHeader>
          <CardContent>
            {myClasses.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">배정된 반이 없습니다</p>
                <p className="text-xs mt-1">선생님께 문의해 주세요</p>
              </div>
            ) : todaySchedules.length > 0 ? (
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

        {/* 학습 진도 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">학습 진도</CardTitle>
              <Link href="/progress"><Button variant="ghost" size="sm" className="text-blue-600">자세히 보기</Button></Link>
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
                    <div key={prog.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{prog.classes?.name ?? "반 없음"}</p>
                          {prog.unit_name && <p className="text-sm text-gray-500">{prog.unit_name}{prog.chapter && ` - ${prog.chapter}`}</p>}
                        </div>
                        <span className={`text-lg font-bold ${textColor}`}>{rate}%</span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${colorClass}`} style={{ width: `${rate}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">등록된 학습 진도가 없습니다</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
