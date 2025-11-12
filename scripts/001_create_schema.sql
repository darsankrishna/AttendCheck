-- Create profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create classes table
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create students table
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id text not null,
  name text not null,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;

-- RLS Policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- RLS Policies for classes
create policy "Teachers can view their own classes"
  on public.classes for select
  using (auth.uid() = teacher_id);

create policy "Teachers can insert their own classes"
  on public.classes for insert
  with check (auth.uid() = teacher_id);

create policy "Teachers can update their own classes"
  on public.classes for update
  using (auth.uid() = teacher_id);

create policy "Teachers can delete their own classes"
  on public.classes for delete
  using (auth.uid() = teacher_id);

-- RLS Policies for students
create policy "Teachers can view students in their classes"
  on public.students for select
  using (
    exists (
      select 1 from public.classes
      where classes.id = students.class_id
      and classes.teacher_id = auth.uid()
    )
  );

create policy "Teachers can insert students in their classes"
  on public.students for insert
  with check (
    exists (
      select 1 from public.classes
      where classes.id = students.class_id
      and classes.teacher_id = auth.uid()
    )
  );

create policy "Teachers can delete students from their classes"
  on public.students for delete
  using (
    exists (
      select 1 from public.classes
      where classes.id = students.class_id
      and classes.teacher_id = auth.uid()
    )
  );

-- Create trigger for automatic profile creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
