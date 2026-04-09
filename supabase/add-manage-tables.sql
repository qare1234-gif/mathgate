-- 반에 선생님 이름 텍스트로 추가 (auth 불필요)
ALTER TABLE classes ADD COLUMN IF NOT EXISTS teacher_name text;

-- 학생 테이블 (auth 불필요)
CREATE TABLE IF NOT EXISTS students (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 반-학생 배정 테이블
CREATE TABLE IF NOT EXISTS class_students (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(class_id, student_id)
);

-- RLS 비활성화
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE class_students DISABLE ROW LEVEL SECURITY;
