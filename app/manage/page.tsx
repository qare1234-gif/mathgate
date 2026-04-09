"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen, Users, Plus, Trash2, Edit2, X, Check, ChevronDown, ChevronRight, UserPlus, GraduationCap
} from "lucide-react";
import { cn } from "@/lib/utils";

type Class = { id: string; name: string; teacher_name: string | null };
type Student = { id: string; name: string; grade: string | null };
type Teacher = { id: string; name: string };

export default function ManagePage() {
  const router = useRouter();
  const [role, setRole] = useState<string>("");
  const [tab, setTab] = useState<"classes" | "students" | "teachers">("classes");

  // Classes state
  const [classes, setClasses] = useState<Class[]>([]);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [classStudents, setClassStudents] = useState<Record<string, string[]>>({});
  const [newClassName, setNewClassName] = useState("");
  const [newClassTeacher, setNewClassTeacher] = useState("");
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [showAddClass, setShowAddClass] = useState(false);

  // Students state
  const [students, setStudents] = useState<Student[]>([]);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState("");
  const [showAddStudent, setShowAddStudent] = useState(false);

  // Teachers state
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [newTeacherName, setNewTeacherName] = useState("");
  const [showAddTeacher, setShowAddTeacher] = useState(false);

  // Assign modal state
  const [assigningClass, setAssigningClass] = useState<Class | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const r = localStorage.getItem("userRole") || "";
    if (!r || r === "student") { router.push("/login"); return; }
    setRole(r);
    fetchClasses();
    fetchStudents();
    fetchTeachers();
  }, [router]);

  const fetchClasses = async () => {
    const { data } = await supabase.from("classes").select("*").order("name");
    setClasses(data ?? []);
  };

  const fetchStudents = async () => {
    const { data } = await supabase.from("students").select("*").order("name");
    setStudents(data ?? []);
  };

  const fetchTeachers = async () => {
    const { data } = await supabase.from("teachers").select("*").order("name");
    setTeachers(data ?? []);
  };

  const fetchClassStudents = async (classId: string) => {
    const { data } = await supabase
      .from("class_students")
      .select("student_id")
      .eq("class_id", classId);
    setClassStudents((prev) => ({
      ...prev,
      [classId]: (data ?? []).map((d) => d.student_id),
    }));
  };

  const handleExpandClass = (cls: Class) => {
    if (expandedClass === cls.id) {
      setExpandedClass(null);
    } else {
      setExpandedClass(cls.id);
      fetchClassStudents(cls.id);
    }
  };

  // --- Class CRUD ---
  const handleAddClass = async () => {
    if (!newClassName.trim()) return;
    await supabase.from("classes").insert({ name: newClassName.trim(), teacher_name: newClassTeacher.trim() || null });
    setNewClassName("");
    setNewClassTeacher("");
    setShowAddClass(false);
    fetchClasses();
  };

  const handleEditClass = async () => {
    if (!editingClass || !editingClass.name.trim()) return;
    await supabase.from("classes").update({ name: editingClass.name, teacher_name: editingClass.teacher_name }).eq("id", editingClass.id);
    setEditingClass(null);
    fetchClasses();
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm("이 반을 삭제하시겠습니까? 관련 시간표와 진도도 삭제됩니다.")) return;
    await supabase.from("classes").delete().eq("id", id);
    fetchClasses();
  };

  // --- Student CRUD ---
  const handleAddStudent = async () => {
    if (!newStudentName.trim()) return;
    await supabase.from("students").insert({ name: newStudentName.trim(), grade: newStudentGrade.trim() || null });
    setNewStudentName("");
    setNewStudentGrade("");
    setShowAddStudent(false);
    fetchStudents();
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm("이 학생을 삭제하시겠습니까?")) return;
    await supabase.from("students").delete().eq("id", id);
    fetchStudents();
  };

  // --- Teacher CRUD ---
  const handleAddTeacher = async () => {
    if (!newTeacherName.trim()) return;
    await supabase.from("teachers").insert({ name: newTeacherName.trim() });
    setNewTeacherName("");
    setShowAddTeacher(false);
    fetchTeachers();
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm("이 선생님을 삭제하시겠습니까?")) return;
    await supabase.from("teachers").delete().eq("id", id);
    fetchTeachers();
  };

  // --- Assign students to class ---
  const handleToggleStudentInClass = async (classId: string, studentId: string, isAssigned: boolean) => {
    if (isAssigned) {
      await supabase.from("class_students").delete().eq("class_id", classId).eq("student_id", studentId);
    } else {
      await supabase.from("class_students").insert({ class_id: classId, student_id: studentId });
    }
    fetchClassStudents(classId);
    if (assigningClass?.id === classId) fetchClassStudents(classId);
  };

  const getStudentName = (id: string) => students.find((s) => s.id === id)?.name ?? "";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">반 · 학생 · 선생님 관리</h1>
        <p className="text-gray-500 mt-1">반을 만들고 선생님과 학생을 배정하세요.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: "classes", label: "반 관리", icon: BookOpen },
          { id: "teachers", label: "선생님 관리", icon: GraduationCap },
          { id: "students", label: "학생 관리", icon: Users },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all",
                tab === t.id ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ===== 반 관리 탭 ===== */}
      {tab === "classes" && (
        <div className="space-y-4">
          {/* Add class button */}
          {!showAddClass ? (
            <Button onClick={() => setShowAddClass(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Plus className="w-4 h-4" /> 반 추가
            </Button>
          ) : (
            <Card className="border-blue-200 shadow-sm">
              <CardContent className="p-4">
                <p className="font-semibold text-gray-900 mb-4">새 반 추가</p>
                <div className="space-y-4">
                  {/* 반 이름 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">반 이름</label>
                    <input
                      type="text"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="예: 중등 1반"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>
                  {/* 담당 선생님 라디오 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">담당 선생님</label>
                    {teachers.length === 0 ? (
                      <p className="text-sm text-gray-400">먼저 선생님 관리 탭에서 선생님을 추가해 주세요.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {teachers.map((t) => (
                          <label key={t.id} className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all select-none",
                            newClassTeacher === t.name
                              ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                              : "border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50"
                          )}>
                            <input
                              type="radio"
                              name="new-class-teacher"
                              value={t.name}
                              checked={newClassTeacher === t.name}
                              onChange={() => setNewClassTeacher(t.name)}
                              className="sr-only"
                            />
                            {t.name}
                          </label>
                        ))}
                        <label className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all select-none",
                          newClassTeacher === ""
                            ? "border-gray-400 bg-gray-50 text-gray-700 font-semibold"
                            : "border-gray-200 text-gray-400 hover:border-gray-300"
                        )}>
                          <input type="radio" name="new-class-teacher" value="" checked={newClassTeacher === ""} onChange={() => setNewClassTeacher("")} className="sr-only" />
                          미배정
                        </label>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button onClick={handleAddClass} className="bg-blue-600 hover:bg-blue-700 text-white gap-1">
                      <Check className="w-4 h-4" /> 추가
                    </Button>
                    <Button variant="ghost" onClick={() => { setShowAddClass(false); setNewClassName(""); setNewClassTeacher(""); }}>
                      취소
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Class list */}
          {classes.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>등록된 반이 없습니다. 반을 추가해 주세요.</p>
            </div>
          ) : (
            classes.map((cls) => {
              const isExpanded = expandedClass === cls.id;
              const assignedIds = classStudents[cls.id] ?? [];
              const isEditing = editingClass?.id === cls.id;

              return (
                <Card key={cls.id} className="shadow-sm overflow-hidden">
                  <CardContent className="p-0">
                    {/* Class row */}
                    <div className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                      <button onClick={() => handleExpandClass(cls)} className="flex items-center gap-3 flex-1 text-left">
                        <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                        </div>
                        {isEditing ? (
                          <div className="flex-1 space-y-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              value={editingClass.name}
                              onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                              className="px-2 py-1 border border-blue-300 rounded text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <div className="flex flex-wrap gap-1.5">
                              {teachers.map((t) => (
                                <label key={t.id} className={cn(
                                  "flex items-center px-3 py-1 rounded-lg border-2 cursor-pointer text-xs transition-all select-none",
                                  editingClass.teacher_name === t.name
                                    ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                                    : "border-gray-200 text-gray-500 hover:border-blue-300"
                                )}>
                                  <input type="radio" name={`edit-teacher-${cls.id}`} value={t.name} checked={editingClass.teacher_name === t.name} onChange={() => setEditingClass({ ...editingClass, teacher_name: t.name })} className="sr-only" />
                                  {t.name}
                                </label>
                              ))}
                              <label className={cn(
                                "flex items-center px-3 py-1 rounded-lg border-2 cursor-pointer text-xs transition-all select-none",
                                !editingClass.teacher_name ? "border-gray-400 bg-gray-50 text-gray-600 font-semibold" : "border-gray-200 text-gray-400 hover:border-gray-300"
                              )}>
                                <input type="radio" name={`edit-teacher-${cls.id}`} value="" checked={!editingClass.teacher_name} onChange={() => setEditingClass({ ...editingClass, teacher_name: null })} className="sr-only" />
                                미배정
                              </label>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{cls.name}</p>
                            <p className="text-xs text-gray-500">
                              담당: {cls.teacher_name || "미배정"} · 학생 {assignedIds.length}명
                            </p>
                          </div>
                        )}
                        {!isEditing && (isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />)}
                      </button>

                      {/* Actions */}
                      <div className="flex gap-1 shrink-0">
                        {isEditing ? (
                          <>
                            <Button size="sm" onClick={handleEditClass} className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 gap-1">
                              <Check className="w-3.5 h-3.5" /> 저장
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingClass(null)} className="h-8 px-2">
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setAssigningClass(cls); fetchClassStudents(cls.id); }} className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="학생 배정">
                              <UserPlus className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditingClass(cls); }} className="h-8 px-2 text-gray-500 hover:text-gray-700">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id); }} className="h-8 px-2 text-red-400 hover:text-red-600 hover:bg-red-50">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Expanded: students in class */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">배정된 학생</p>
                        {assignedIds.length === 0 ? (
                          <p className="text-sm text-gray-400 py-2">배정된 학생이 없습니다.
                            <button onClick={() => setAssigningClass(cls)} className="ml-2 text-blue-500 hover:underline">학생 배정하기</button>
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {assignedIds.map((sid) => (
                              <span key={sid} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-sm px-3 py-1 rounded-full">
                                {getStudentName(sid)}
                                <button onClick={() => handleToggleStudentInClass(cls.id, sid, true)} className="text-gray-400 hover:text-red-500 ml-0.5">
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* ===== 학생 관리 탭 ===== */}
      {tab === "students" && (
        <div className="space-y-4">
          {!showAddStudent ? (
            <Button onClick={() => setShowAddStudent(true)} className="bg-green-600 hover:bg-green-700 text-white gap-2">
              <Plus className="w-4 h-4" /> 학생 추가
            </Button>
          ) : (
            <Card className="border-green-200 shadow-sm">
              <CardContent className="p-4">
                <p className="font-semibold text-gray-900 mb-4">새 학생 추가</p>
                <div className="space-y-4">
                  {/* 이름 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">이름</label>
                    <input
                      type="text"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      placeholder="학생 이름"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      autoFocus
                    />
                  </div>
                  {/* 학년 체크박스 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">학년</label>
                    <div className="space-y-2">
                      {[
                        { group: "초등", grades: ["초1", "초2", "초3", "초4", "초5", "초6"] },
                        { group: "중등", grades: ["중1", "중2", "중3"] },
                        { group: "고등", grades: ["고1", "고2", "고3"] },
                      ].map(({ group, grades }) => (
                        <div key={group} className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs text-gray-400 w-8">{group}</span>
                          {grades.map((g) => (
                            <label key={g} className={cn(
                              "flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 text-sm cursor-pointer transition-all select-none",
                              newStudentGrade === g
                                ? "border-green-500 bg-green-50 text-green-700 font-semibold"
                                : "border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50"
                            )}>
                              <input
                                type="radio"
                                name="grade"
                                value={g}
                                checked={newStudentGrade === g}
                                onChange={() => setNewStudentGrade(g)}
                                className="sr-only"
                              />
                              {g}
                            </label>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* 버튼 */}
                  <div className="flex gap-2 pt-1">
                    <Button onClick={handleAddStudent} className="bg-green-600 hover:bg-green-700 text-white gap-1">
                      <Check className="w-4 h-4" /> 추가
                    </Button>
                    <Button variant="ghost" onClick={() => { setShowAddStudent(false); setNewStudentName(""); setNewStudentGrade(""); }}>
                      취소
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {students.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>등록된 학생이 없습니다. 학생을 추가해 주세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {students.map((s) => (
                <Card key={s.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-base shrink-0">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{s.name}</p>
                        {s.grade && <p className="text-xs text-gray-500">{s.grade}</p>}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteStudent(s.id)}
                      className="h-8 px-2 text-red-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== 선생님 관리 탭 ===== */}
      {tab === "teachers" && (
        <div className="space-y-4">
          {!showAddTeacher ? (
            <Button onClick={() => setShowAddTeacher(true)} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
              <Plus className="w-4 h-4" /> 선생님 추가
            </Button>
          ) : (
            <Card className="border-purple-200 shadow-sm">
              <CardContent className="p-4">
                <p className="font-semibold text-gray-900 mb-3">새 선생님 추가</p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTeacher()}
                    placeholder="선생님 이름"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    autoFocus
                  />
                  <Button onClick={handleAddTeacher} className="bg-purple-600 hover:bg-purple-700 text-white gap-1">
                    <Check className="w-4 h-4" /> 추가
                  </Button>
                  <Button variant="ghost" onClick={() => { setShowAddTeacher(false); setNewTeacherName(""); }}>
                    취소
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-2">선생님이 이 이름으로 로그인하면 본인의 시간표를 볼 수 있습니다.</p>
              </CardContent>
            </Card>
          )}

          {teachers.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>등록된 선생님이 없습니다. 선생님을 추가해 주세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {teachers.map((t) => (
                <Card key={t.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-base shrink-0">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{t.name}</p>
                        <p className="text-xs text-gray-400">선생님</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteTeacher(t.id)}
                      className="h-8 px-2 text-red-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== 학생 배정 모달 ===== */}
      {assigningClass && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{assigningClass.name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">학생을 선택하여 반에 배정하세요</p>
              </div>
              <button onClick={() => { setAssigningClass(null); fetchClasses(); }} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4">
              {students.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">등록된 학생이 없습니다.</p>
                  <p className="text-xs mt-1">먼저 학생 관리에서 학생을 추가해 주세요.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {students.map((s) => {
                    const isAssigned = (classStudents[assigningClass.id] ?? []).includes(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleToggleStudentInClass(assigningClass.id, s.id, isAssigned)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                          isAssigned
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                        )}
                      >
                        <div className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center font-bold text-base shrink-0",
                          isAssigned ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"
                        )}>
                          {s.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className={cn("font-medium", isAssigned ? "text-blue-700" : "text-gray-700")}>{s.name}</p>
                          {s.grade && <p className={cn("text-xs", isAssigned ? "text-blue-400" : "text-gray-400")}>{s.grade}</p>}
                        </div>
                        {isAssigned && <Check className="w-5 h-5 text-blue-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t">
              <Button
                onClick={() => { setAssigningClass(null); fetchClasses(); fetchClassStudents(assigningClass.id); }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                완료
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
