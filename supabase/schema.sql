-- profiles table (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text not null,
  role text not null check (role in ('principal', 'teacher', 'student')),
  created_at timestamptz default now()
);

-- classes table
create table classes (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  teacher_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- student_classes (many-to-many)
create table student_classes (
  student_id uuid references profiles(id) on delete cascade,
  class_id uuid references classes(id) on delete cascade,
  primary key (student_id, class_id)
);

-- schedules table
create table schedules (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references classes(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6), -- 0=Mon
  start_time time not null,
  end_time time not null,
  created_at timestamptz default now()
);

-- progress table (per class)
create table progress (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references classes(id) on delete cascade,
  unit_name text,
  chapter text,
  progress_rate int default 0 check (progress_rate between 0 and 100),
  notes text,
  updated_at timestamptz default now()
);

-- student_progress table (per student per progress)
create table student_progress (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references profiles(id) on delete cascade,
  progress_id uuid references progress(id) on delete cascade,
  homework_done boolean default false,
  test_score int,
  teacher_memo text,
  updated_at timestamptz default now(),
  unique (student_id, progress_id)
);

-- RLS policies
alter table profiles enable row level security;
alter table classes enable row level security;
alter table student_classes enable row level security;
alter table schedules enable row level security;
alter table progress enable row level security;
alter table student_progress enable row level security;

-- Allow users to read their own profile
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Principal can do everything; teachers/students read-only on most tables
create policy "All authenticated can view profiles" on profiles for select using (auth.role() = 'authenticated');
create policy "All authenticated can view classes" on classes for select using (auth.role() = 'authenticated');
create policy "Principal and teacher can manage classes" on classes for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('principal', 'teacher'))
);
create policy "All authenticated can view schedules" on schedules for select using (auth.role() = 'authenticated');
create policy "Principal and teacher can manage schedules" on schedules for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('principal', 'teacher'))
);
create policy "All authenticated can view progress" on progress for select using (auth.role() = 'authenticated');
create policy "Teacher and principal can manage progress" on progress for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('principal', 'teacher'))
);
create policy "All authenticated can view student_progress" on student_progress for select using (auth.role() = 'authenticated');
create policy "Teacher and principal can manage student_progress" on student_progress for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('principal', 'teacher'))
);
create policy "All authenticated can view student_classes" on student_classes for select using (auth.role() = 'authenticated');
create policy "Principal can manage student_classes" on student_classes for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'principal')
);

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', new.email), coalesce(new.raw_user_meta_data->>'role', 'student'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
