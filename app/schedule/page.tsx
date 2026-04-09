"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Edit2, Trash2, Calendar, ChevronLeft, ChevronRight, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["월", "화", "수", "목", "금", "토", "일"];
const TIME_SLOTS = Array.from({ length: 13 }, (_, i) => `${String(9 + i).padStart(2, "0")}:00`);

const CLASS_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
  { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300" },
  { bg: "bg-green-100", text: "text-green-800", border: "border-green-300" },
  { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300" },
  { bg: "bg-pink-100", text: "text-pink-800", border: "border-pink-300" },
  { bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-300" },
  { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300" },
  { bg: "bg-teal-100", text: "text-teal-800", border: "border-teal-300" },
];

type Schedule = {
  id: string;
  class_id: string;
  teacher_name: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  classes?: { name: string };
};

type ClassOption = { id: string; name: string; teacher_name: string | null };

export default function SchedulePage() {
  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [teachers, setTeachers] = useState<string[]>([]); // unique teacher names
  const [selectedTeacher, setSelectedTeacher] = useState<string>(""); // for principal
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [studentModal, setStudentModal] = useState<{ schedule: Schedule; students: { name: string; grade: string | null }[] } | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [form, setForm] = useState({
    class_id: "",
    teacher_name: "",
    day_of_week: "0",
    start_time: "09:00",
    end_time: "10:00",
  });

  // For student: their class IDs
  const [studentClassIds, setStudentClassIds] = useState<string[]>([]);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const r = localStorage.getItem("userRole") || "";
    const uName = localStorage.getItem("userName") || "";
    setRole(r);
    setUserName(uName);

    // Fetch all classes
    const { data: classData } = await supabase
      .from("classes")
      .select("id, name, teacher_name")
      .order("name");
    const allClasses: ClassOption[] = classData ?? [];
    setClasses(allClasses);

    // Unique teacher names from classes
    const teacherNames = Array.from(
      new Set(allClasses.map((c) => c.teacher_name).filter(Boolean) as string[])
    ).sort();
    setTeachers(teacherNames);

    // Fetch schedules
    let query = supabase
      .from("schedules")
      .select("*, classes(name)")
      .order("day_of_week")
      .order("start_time");

    if (r === "teacher") {
      query = query.eq("teacher_name", uName);
    } else if (r === "student") {
      const studentId = localStorage.getItem("studentId") || "";
      const { data: cs } = await supabase
        .from("class_students")
        .select("class_id")
        .eq("student_id", studentId);
      const ids = (cs ?? []).map((x: any) => x.class_id);
      setStudentClassIds(ids);
      if (ids.length > 0) {
        query = query.in("class_id", ids);
      } else {
        setSchedules([]);
        setLoading(false);
        return;
      }
    }

    const { data } = await query;
    setSchedules((data as Schedule[]) ?? []);

    // Set default selected teacher for principal
    if (r === "principal" && teacherNames.length > 0) {
      setSelectedTeacher((prev) => prev || teacherNames[0]);
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Schedules filtered for the current view
  const visibleSchedules = (() => {
    if (role === "principal") {
      return selectedTeacher
        ? schedules.filter((s) => s.teacher_name === selectedTeacher)
        : schedules;
    }
    return schedules;
  })();

  // Color map by class_id
  const uniqueClassIds = Array.from(new Set(visibleSchedules.map((s) => s.class_id)));
  const classColorMap: Record<string, typeof CLASS_COLORS[0]> = {};
  uniqueClassIds.forEach((id, i) => { classColorMap[id] = CLASS_COLORS[i % CLASS_COLORS.length]; });

  const timeToMinutes = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const getPos = (s: Schedule) => {
    const gridStart = 9 * 60;
    const top = ((timeToMinutes(s.start_time) - gridStart) / 60) * 64;
    const height = ((timeToMinutes(s.end_time) - timeToMinutes(s.start_time)) / 60) * 64;
    return { top, height };
  };

  const handleViewStudents = async (s: Schedule) => {
    setLoadingStudents(true);
    setStudentModal({ schedule: s, students: [] });
    const { data } = await supabase
      .from("class_students")
      .select("students(name, grade)")
      .eq("class_id", s.class_id);
    const studentList = (data ?? [])
      .map((d: any) => d.students)
      .filter(Boolean)
      .sort((a: any, b: any) => a.name.localeCompare(b.name));
    setStudentModal({ schedule: s, students: studentList });
    setLoadingStudents(false);
  };

  const handleAdd = () => {
    setEditingSchedule(null);
    setForm({
      class_id: "",
      teacher_name: role === "teacher" ? userName : (selectedTeacher || ""),
      day_of_week: "0",
      start_time: "09:00",
      end_time: "10:00",
    });
    setDialogOpen(true);
  };

  const handleEdit = (s: Schedule) => {
    setEditingSchedule(s);
    setForm({
      class_id: s.class_id,
      teacher_name: s.teacher_name || "",
      day_of_week: String(s.day_of_week),
      start_time: s.start_time.slice(0, 5),
      end_time: s.end_time.slice(0, 5),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.class_id) { alert("반을 선택해주세요."); return; }
    if (!form.teacher_name.trim()) { alert("담당 선생님을 입력해주세요."); return; }
    if (form.start_time >= form.end_time) { alert("시작 시간은 종료 시간보다 빨라야 합니다."); return; }

    const payload = {
      class_id: form.class_id,
      teacher_name: form.teacher_name.trim(),
      day_of_week: parseInt(form.day_of_week),
      start_time: form.start_time,
      end_time: form.end_time,
    };

    if (editingSchedule) {
      await supabase.from("schedules").update(payload).eq("id", editingSchedule.id);
    } else {
      await supabase.from("schedules").insert(payload);
    }

    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("schedules").delete().eq("id", id);
    setDeleteConfirm(null);
    fetchData();
  };

  const canManage = role === "principal" || role === "teacher";

  // Teacher tab navigation
  const teacherIdx = teachers.indexOf(selectedTeacher);
  const prevTeacher = () => setSelectedTeacher(teachers[Math.max(0, teacherIdx - 1)]);
  const nextTeacher = () => setSelectedTeacher(teachers[Math.min(teachers.length - 1, teacherIdx + 1)]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Calendar className="w-10 h-10 text-blue-400 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {role === "teacher" ? `${userName} 선생님 시간표` : "시간표"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">주간 수업 시간표</p>
        </div>
        {canManage && (
          <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus className="w-4 h-4" /> 수업 추가
          </Button>
        )}
      </div>

      {/* Principal: teacher tabs */}
      {role === "principal" && teachers.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-gray-500 font-medium">선생님 선택</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={prevTeacher}
              disabled={teacherIdx <= 0}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <div className="flex gap-1.5 flex-wrap">
              {teachers.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTeacher(t)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium border transition-all",
                    selectedTeacher === t
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                  )}
                >
                  {t}
                </button>
              ))}
              <button
                onClick={() => setSelectedTeacher("")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium border transition-all",
                  selectedTeacher === ""
                    ? "bg-gray-700 text-white border-gray-700"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                )}
              >
                전체
              </button>
            </div>
            <button
              onClick={nextTeacher}
              disabled={teacherIdx >= teachers.length - 1}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      {uniqueClassIds.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {uniqueClassIds.map((classId) => {
            const color = classColorMap[classId];
            const name = classes.find((c) => c.id === classId)?.name
              ?? visibleSchedules.find((s) => s.class_id === classId)?.classes?.name
              ?? "알 수 없음";
            return (
              <div key={classId} className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border", color.bg, color.text, color.border)}>
                {name}
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Grid */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="min-w-[700px]">
          {/* Day headers */}
          <div className="grid grid-cols-8 border-b border-gray-200">
            <div className="py-3 px-2 text-center text-xs font-medium text-gray-400 border-r border-gray-100">시간</div>
            {DAY_NAMES.map((day, index) => {
              const isToday = index === (new Date().getDay() + 6) % 7;
              return (
                <div key={day} className={cn("py-3 px-2 text-center text-sm font-semibold border-r border-gray-100 last:border-r-0", isToday ? "text-blue-600 bg-blue-50" : "text-gray-700")}>
                  {day}요일
                  {isToday && <span className="block text-xs font-normal text-blue-400">오늘</span>}
                </div>
              );
            })}
          </div>

          {/* Grid body */}
          <div className="relative grid grid-cols-8">
            {/* Time labels */}
            <div className="border-r border-gray-100">
              {TIME_SLOTS.map((time) => (
                <div key={time} className="h-16 border-b border-gray-50 flex items-start justify-center pt-1">
                  <span className="text-xs text-gray-400">{time}</span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {DAY_NAMES.map((_, dayIndex) => {
              const daySchedules = visibleSchedules.filter((s) => s.day_of_week === dayIndex);
              const isToday = dayIndex === (new Date().getDay() + 6) % 7;
              return (
                <div key={dayIndex} className={cn("relative border-r border-gray-100 last:border-r-0", isToday ? "bg-blue-50/30" : "")}>
                  {TIME_SLOTS.map((t) => <div key={t} className="h-16 border-b border-gray-50" />)}

                  {daySchedules.map((s) => {
                    const { top, height } = getPos(s);
                    const color = classColorMap[s.class_id] ?? CLASS_COLORS[0];
                    const clsName = s.classes?.name ?? classes.find((c) => c.id === s.class_id)?.name ?? "수업";
                    return (
                      <div
                        key={s.id}
                        onClick={() => handleViewStudents(s)}
                        className={cn("absolute left-0.5 right-0.5 rounded-lg border p-1.5 overflow-hidden cursor-pointer group hover:shadow-md transition-shadow", color.bg, color.border)}
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <div className={cn("text-xs font-bold leading-tight truncate", color.text)}>{clsName}</div>
                        <div className={cn("text-xs mt-0.5 opacity-75", color.text)}>{s.start_time.slice(0,5)}~{s.end_time.slice(0,5)}</div>
                        {role === "principal" && s.teacher_name && (
                          <div className={cn("text-xs mt-0.5 opacity-60 truncate", color.text)}>{s.teacher_name}</div>
                        )}

                        {canManage && (
                          <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
                            <button onClick={(e) => { e.stopPropagation(); handleEdit(s); }} className="w-5 h-5 bg-white/90 rounded shadow flex items-center justify-center hover:bg-white">
                              <Edit2 className="w-3 h-3 text-gray-600" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(s.id); }} className="w-5 h-5 bg-white/90 rounded shadow flex items-center justify-center hover:bg-red-50">
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {visibleSchedules.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Calendar className="w-14 h-14 mx-auto mb-3 opacity-20" />
          <p className="font-medium">등록된 시간표가 없습니다</p>
          {canManage && <p className="text-sm mt-1">수업 추가 버튼으로 시간표를 등록하세요</p>}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSchedule ? "시간표 수정" : "시간표 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* 담당 선생님 */}
            <div className="space-y-2">
              <Label>담당 선생님</Label>
              {role === "teacher" ? (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-700">
                  {userName}
                </div>
              ) : (
                <Select value={form.teacher_name} onValueChange={(v) => setForm((f) => ({ ...f, teacher_name: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="선생님을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* 반 선택 */}
            <div className="space-y-2">
              <Label>반</Label>
              <Select value={form.class_id} onValueChange={(v) => setForm((f) => ({ ...f, class_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="반을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 요일 */}
            <div className="space-y-2">
              <Label>요일</Label>
              <Select value={form.day_of_week} onValueChange={(v) => setForm((f) => ({ ...f, day_of_week: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAY_NAMES.map((day, i) => (
                    <SelectItem key={i} value={String(i)}>{day}요일</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 시간 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>시작 시간</Label>
                <Input type="time" value={form.start_time} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>종료 시간</Label>
                <Input type="time" value={form.end_time} onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
              {editingSchedule ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 학생 목록 모달 */}
      {studentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setStudentModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {studentModal.schedule.classes?.name ?? classes.find((c) => c.id === studentModal.schedule.class_id)?.name ?? "수업"}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {DAY_NAMES[studentModal.schedule.day_of_week]}요일 · {studentModal.schedule.start_time.slice(0,5)} ~ {studentModal.schedule.end_time.slice(0,5)}
                  {studentModal.schedule.teacher_name && ` · ${studentModal.schedule.teacher_name}`}
                </p>
              </div>
              <button onClick={() => setStudentModal(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Student list */}
            <div className="p-4 max-h-72 overflow-y-auto">
              {loadingStudents ? (
                <div className="text-center py-8 text-gray-400 text-sm">불러오는 중...</div>
              ) : studentModal.students.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">배정된 학생이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    수강 학생 ({studentModal.students.length}명)
                  </p>
                  {studentModal.students.map((st, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                        {st.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{st.name}</p>
                        {st.grade && <p className="text-xs text-gray-400">{st.grade}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t">
              <button onClick={() => setStudentModal(null)} className="w-full py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>시간표 삭제</DialogTitle></DialogHeader>
          <p className="text-gray-600 text-sm">이 시간표를 삭제하시겠습니까?</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>취소</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>삭제</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
