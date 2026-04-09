"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, Save, CheckCircle, XCircle, Star, BookOpen } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ClassOption {
  id: string;
  name: string;
  teacher_name?: string;
}

interface ProgressRecord {
  id: string;
  class_id: string;
  unit_name: string | null;
  chapter: string | null;
  progress_rate: number;
  notes: string | null;
  updated_at: string;
}

interface StudentProgressRecord {
  id?: string;
  student_id: string;
  student_name: string;
  progress_id: string;
  homework_done: boolean;
  test_score: number | null;
  teacher_memo: string | null;
}

function ProgressBar({ value }: { value: number }) {
  const colorClass =
    value >= 70 ? "bg-green-500" : value >= 40 ? "bg-yellow-500" : "bg-red-500";
  const bgClass =
    value >= 70 ? "bg-green-100" : value >= 40 ? "bg-yellow-100" : "bg-red-100";
  const textColor =
    value >= 70 ? "text-green-700" : value >= 40 ? "text-yellow-700" : "text-red-700";

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className={`text-sm font-bold ${textColor}`}>{value}%</span>
      </div>
      <div className={`h-3 rounded-full overflow-hidden ${bgClass}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// Principal view
function PrincipalView({ classes }: { classes: ClassOption[] }) {
  const [allProgress, setAllProgress] = useState<
    (ProgressRecord & { class_name?: string })[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("progress")
        .select("*, classes(name)")
        .order("updated_at", { ascending: false });
      setAllProgress(
        (data ?? []).map((d: any) => ({
          ...d,
          class_name: d.classes?.name,
        }))
      );
      setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <TrendingUp className="w-8 h-8 text-blue-400 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">전체 반 학습 진도</h2>
      {allProgress.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allProgress.map((prog) => (
            <Card key={prog.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {prog.class_name ?? "반 없음"}
                    </p>
                    {prog.unit_name && (
                      <p className="text-sm text-gray-500">
                        {prog.unit_name}
                        {prog.chapter && ` - ${prog.chapter}`}
                      </p>
                    )}
                    {prog.notes && (
                      <p className="text-xs text-gray-400 mt-1">{prog.notes}</p>
                    )}
                  </div>
                  <span
                    className={`text-lg font-bold ${
                      prog.progress_rate >= 70
                        ? "text-green-600"
                        : prog.progress_rate >= 40
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {prog.progress_rate}%
                  </span>
                </div>
                <ProgressBar value={prog.progress_rate} />
                <p className="text-xs text-gray-400 mt-2">
                  최근 업데이트:{" "}
                  {new Date(prog.updated_at).toLocaleDateString("ko-KR")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>등록된 학습 진도가 없습니다</p>
        </div>
      )}
    </div>
  );
}

// Teacher view
function TeacherView({ profile }: { profile: Profile }) {
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [progressRecord, setProgressRecord] = useState<ProgressRecord | null>(null);
  const [students, setStudents] = useState<StudentProgressRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [progForm, setProgForm] = useState({
    unit_name: "",
    chapter: "",
    progress_rate: 0,
    notes: "",
  });

  useEffect(() => {
    const fetchClasses = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("classes")
        .select("id, name, profiles(name)")
        .eq("teacher_id", profile.id)
        .order("name");

      setClasses(
        (data ?? []).map((c: any) => ({
          id: c.id,
          name: c.name,
          teacher_name: c.profiles?.name,
        }))
      );
    };
    fetchClasses();
  }, [profile.id]);

  const fetchClassProgress = useCallback(async (classId: string) => {
    setLoading(true);
    const supabase = createClient();

    // Fetch progress record for this class
    const { data: prog } = await supabase
      .from("progress")
      .select("*")
      .eq("class_id", classId)
      .single();

    if (prog) {
      setProgressRecord(prog as ProgressRecord);
      setProgForm({
        unit_name: prog.unit_name ?? "",
        chapter: prog.chapter ?? "",
        progress_rate: prog.progress_rate ?? 0,
        notes: prog.notes ?? "",
      });
    } else {
      setProgressRecord(null);
      setProgForm({ unit_name: "", chapter: "", progress_rate: 0, notes: "" });
    }

    // Fetch students in this class
    const { data: sc } = await supabase
      .from("student_classes")
      .select("student_id, profiles(id, name)")
      .eq("class_id", classId);

    const studentList = (sc ?? []).map((s: any) => ({
      student_id: s.student_id,
      student_name: s.profiles?.name ?? "이름 없음",
      progress_id: prog?.id ?? "",
      homework_done: false,
      test_score: null,
      teacher_memo: null,
    }));

    // If progress exists, fetch student_progress
    if (prog?.id) {
      const studentIds = studentList.map((s) => s.student_id);
      if (studentIds.length > 0) {
        const { data: sp } = await supabase
          .from("student_progress")
          .select("*")
          .eq("progress_id", prog.id)
          .in("student_id", studentIds);

        const spMap: Record<string, any> = {};
        sp?.forEach((s) => { spMap[s.student_id] = s; });

        studentList.forEach((s) => {
          if (spMap[s.student_id]) {
            s.homework_done = spMap[s.student_id].homework_done ?? false;
            s.test_score = spMap[s.student_id].test_score ?? null;
            s.teacher_memo = spMap[s.student_id].teacher_memo ?? null;
            (s as any).id = spMap[s.student_id].id;
          }
        });
      }
    }

    setStudents(studentList as StudentProgressRecord[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchClassProgress(selectedClassId);
    }
  }, [selectedClassId, fetchClassProgress]);

  const handleSave = async () => {
    if (!selectedClassId) return;
    setSaving(true);
    const supabase = createClient();

    let progressId = progressRecord?.id;

    // Upsert progress record
    if (progressId) {
      await supabase
        .from("progress")
        .update({
          unit_name: progForm.unit_name || null,
          chapter: progForm.chapter || null,
          progress_rate: progForm.progress_rate,
          notes: progForm.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", progressId);
    } else {
      const { data: newProg } = await supabase
        .from("progress")
        .insert({
          class_id: selectedClassId,
          unit_name: progForm.unit_name || null,
          chapter: progForm.chapter || null,
          progress_rate: progForm.progress_rate,
          notes: progForm.notes || null,
        })
        .select()
        .single();
      progressId = newProg?.id;
    }

    // Upsert student_progress for each student
    if (progressId) {
      for (const student of students) {
        await supabase.from("student_progress").upsert(
          {
            student_id: student.student_id,
            progress_id: progressId,
            homework_done: student.homework_done,
            test_score: student.test_score,
            teacher_memo: student.teacher_memo,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "student_id,progress_id" }
        );
      }
    }

    toast({ title: "저장되었습니다." });
    setSaving(false);
    fetchClassProgress(selectedClassId);
  };

  const updateStudent = (studentId: string, field: keyof StudentProgressRecord, value: any) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.student_id === studentId ? { ...s, [field]: value } : s
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-xs">
          <Label className="mb-2 block">반 선택</Label>
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger>
              <SelectValue placeholder="반을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedClassId && (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "저장 중..." : "저장"}
          </Button>
        )}
      </div>

      {selectedClassId && !loading && (
        <>
          {/* Progress form */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">학습 진도 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>단원명</Label>
                  <Input
                    placeholder="예: 1단원 - 수와 연산"
                    value={progForm.unit_name}
                    onChange={(e) =>
                      setProgForm((f) => ({ ...f, unit_name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>챕터</Label>
                  <Input
                    placeholder="예: 1-3 분수의 덧셈"
                    value={progForm.chapter}
                    onChange={(e) =>
                      setProgForm((f) => ({ ...f, chapter: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>진도율 ({progForm.progress_rate}%)</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progForm.progress_rate}
                    onChange={(e) =>
                      setProgForm((f) => ({
                        ...f,
                        progress_rate: parseInt(e.target.value),
                      }))
                    }
                    className="flex-1 h-2 accent-blue-600"
                  />
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={progForm.progress_rate}
                    onChange={(e) =>
                      setProgForm((f) => ({
                        ...f,
                        progress_rate: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)),
                      }))
                    }
                    className="w-20"
                  />
                </div>
                <ProgressBar value={progForm.progress_rate} />
              </div>
              <div className="space-y-2">
                <Label>메모</Label>
                <Textarea
                  placeholder="수업 관련 메모를 입력하세요"
                  value={progForm.notes}
                  onChange={(e) =>
                    setProgForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Students table */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">
                학생별 관리 ({students.length}명)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {students.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>학생 이름</TableHead>
                        <TableHead className="text-center">숙제 완료</TableHead>
                        <TableHead>시험 점수</TableHead>
                        <TableHead>선생님 메모</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.student_id}>
                          <TableCell className="font-medium">
                            {student.student_name}
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={student.homework_done}
                              onCheckedChange={(checked) =>
                                updateStudent(
                                  student.student_id,
                                  "homework_done",
                                  !!checked
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="점수"
                              value={student.test_score ?? ""}
                              onChange={(e) =>
                                updateStudent(
                                  student.student_id,
                                  "test_score",
                                  e.target.value ? parseInt(e.target.value) : null
                                )
                              }
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder="메모 입력..."
                              value={student.teacher_memo ?? ""}
                              onChange={(e) =>
                                updateStudent(
                                  student.student_id,
                                  "teacher_memo",
                                  e.target.value || null
                                )
                              }
                              className="min-w-[200px]"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">이 반에 등록된 학생이 없습니다</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {selectedClassId && loading && (
        <div className="flex items-center justify-center h-40">
          <TrendingUp className="w-8 h-8 text-blue-400 animate-pulse" />
        </div>
      )}

      {!selectedClassId && (
        <div className="text-center py-20 text-gray-400">
          <TrendingUp className="w-14 h-14 mx-auto mb-3 opacity-20" />
          <p className="font-medium">반을 선택하여 학습 진도를 관리하세요</p>
        </div>
      )}
    </div>
  );
}

// Student view
function StudentView({ profile }: { profile: Profile }) {
  const [myProgress, setMyProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      const supabase = createClient();

      // Get my classes
      const { data: sc } = await supabase
        .from("student_classes")
        .select("class_id, classes(id, name)")
        .eq("student_id", profile.id);

      const classIds = sc?.map((x: any) => x.class_id) ?? [];
      const classMap: Record<string, string> = {};
      sc?.forEach((x: any) => {
        if (x.classes) classMap[x.class_id] = x.classes.name;
      });

      if (classIds.length === 0) {
        setLoading(false);
        return;
      }

      // Get progress for my classes
      const { data: progList } = await supabase
        .from("progress")
        .select("*")
        .in("class_id", classIds);

      const progressIds = progList?.map((p) => p.id) ?? [];

      // Get my student_progress
      let studentProgMap: Record<string, any> = {};
      if (progressIds.length > 0) {
        const { data: sp } = await supabase
          .from("student_progress")
          .select("*")
          .eq("student_id", profile.id)
          .in("progress_id", progressIds);
        sp?.forEach((s) => { studentProgMap[s.progress_id] = s; });
      }

      const combined = (progList ?? []).map((prog) => ({
        ...prog,
        class_name: classMap[prog.class_id] ?? "반 없음",
        student_progress: studentProgMap[prog.id] ?? null,
      }));

      setMyProgress(combined);
      setLoading(false);
    };

    fetchProgress();
  }, [profile.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <TrendingUp className="w-8 h-8 text-blue-400 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">내 학습 진도</h2>
      {myProgress.length > 0 ? (
        <div className="space-y-4">
          {myProgress.map((prog) => {
            const sp = prog.student_progress;
            return (
              <Card key={prog.id} className="shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{prog.class_name}</p>
                      {prog.unit_name && (
                        <p className="text-sm text-gray-600">
                          {prog.unit_name}
                          {prog.chapter && ` - ${prog.chapter}`}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xl font-bold ${
                        prog.progress_rate >= 70
                          ? "text-green-600"
                          : prog.progress_rate >= 40
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {prog.progress_rate}%
                    </span>
                  </div>
                  <ProgressBar value={prog.progress_rate} />

                  {prog.notes && (
                    <p className="text-sm text-gray-500 mt-2 p-2 bg-gray-50 rounded">{prog.notes}</p>
                  )}

                  {sp && (
                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2">
                        {sp.homework_done ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                        <div>
                          <p className="text-xs text-gray-500">숙제</p>
                          <p className={`text-sm font-medium ${sp.homework_done ? "text-green-600" : "text-red-500"}`}>
                            {sp.homework_done ? "완료" : "미완료"}
                          </p>
                        </div>
                      </div>

                      {sp.test_score !== null && sp.test_score !== undefined && (
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5 text-yellow-500" />
                          <div>
                            <p className="text-xs text-gray-500">시험 점수</p>
                            <p className="text-sm font-bold text-gray-900">{sp.test_score}점</p>
                          </div>
                        </div>
                      )}

                      {sp.teacher_memo && (
                        <div className="sm:col-span-3">
                          <p className="text-xs text-gray-500 mb-1">선생님 메모</p>
                          <p className="text-sm text-gray-700 bg-blue-50 border border-blue-100 rounded-lg p-3">
                            {sp.teacher_memo}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>등록된 학습 진도가 없습니다</p>
        </div>
      )}
    </div>
  );
}

export default function ProgressPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(prof as Profile);

      if (prof?.role === "principal") {
        const { data: classData } = await supabase
          .from("classes")
          .select("id, name, profiles(name)")
          .order("name");
        setClasses(
          (classData ?? []).map((c: any) => ({
            id: c.id,
            name: c.name,
            teacher_name: c.profiles?.name,
          }))
        );
      }

      setLoading(false);
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <TrendingUp className="w-10 h-10 text-blue-400 animate-pulse" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">학습 진도</h1>
        <p className="text-gray-500 text-sm mt-1">
          {profile.role === "principal" && "전체 반의 학습 진도를 확인하세요"}
          {profile.role === "teacher" && "담당 반의 학습 진도를 관리하세요"}
          {profile.role === "student" && "내 학습 진도를 확인하세요"}
        </p>
      </div>

      {profile.role === "principal" && <PrincipalView classes={classes} />}
      {profile.role === "teacher" && <TeacherView profile={profile} />}
      {profile.role === "student" && <StudentView profile={profile} />}
    </div>
  );
}
