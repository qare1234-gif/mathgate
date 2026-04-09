export interface Profile {
  id: string;
  email: string;
  role: "principal" | "teacher" | "student";
  name: string;
  created_at?: string;
}

export interface Class {
  id: string;
  name: string;
  teacher_id: string | null;
  teacher_name?: string;
  created_at?: string;
}

export interface Schedule {
  id: string;
  class_id: string;
  class_name?: string;
  day_of_week: number; // 0=Mon, 1=Tue, ..., 6=Sun
  start_time: string;  // "HH:MM"
  end_time: string;    // "HH:MM"
  teacher_name?: string;
  created_at?: string;
}

export interface Progress {
  id: string;
  class_id: string;
  class_name?: string;
  unit_name: string | null;
  chapter: string | null;
  progress_rate: number; // 0-100
  notes: string | null;
  updated_at?: string;
}

export interface StudentProgress {
  id: string;
  student_id: string;
  student_name?: string;
  progress_id: string;
  homework_done: boolean;
  test_score: number | null;
  teacher_memo: string | null;
  updated_at?: string;
}

export interface ClassWithTeacher extends Class {
  profiles?: Profile;
}

export interface ScheduleWithClass extends Schedule {
  classes?: ClassWithTeacher;
}
