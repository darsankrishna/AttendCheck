-- Create sessions table
create table if not exists public.sessions (
  id text primary key,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null,
  is_active boolean default true,
  metadata jsonb default '{}'::jsonb
);

-- Create attendance_submissions table
create table if not exists public.attendance_submissions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references public.sessions(id) on delete cascade,
  student_id text not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  selfie_image text, -- base64 encoded image
  liveness_action text,
  verified boolean default false,
  qr_token_hash text, -- hash of the QR token for verification
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(session_id, student_id) -- Prevent duplicate submissions
);

-- Create indexes for performance
create index if not exists idx_sessions_teacher_id on public.sessions(teacher_id);
create index if not exists idx_sessions_expires_at on public.sessions(expires_at);
create index if not exists idx_sessions_is_active on public.sessions(is_active);
create index if not exists idx_submissions_session_id on public.attendance_submissions(session_id);
create index if not exists idx_submissions_student_id on public.attendance_submissions(student_id);
create index if not exists idx_submissions_timestamp on public.attendance_submissions(timestamp);

-- Enable RLS
alter table public.sessions enable row level security;
alter table public.attendance_submissions enable row level security;

-- RLS Policies for sessions
create policy "Teachers can view their own sessions"
  on public.sessions for select
  using (auth.uid() = teacher_id);

create policy "Teachers can create their own sessions"
  on public.sessions for insert
  with check (auth.uid() = teacher_id);

create policy "Teachers can update their own sessions"
  on public.sessions for update
  using (auth.uid() = teacher_id);

create policy "Teachers can delete their own sessions"
  on public.sessions for delete
  using (auth.uid() = teacher_id);

-- RLS Policies for attendance_submissions
create policy "Teachers can view submissions for their sessions"
  on public.attendance_submissions for select
  using (
    exists (
      select 1 from public.sessions
      where sessions.id = attendance_submissions.session_id
      and sessions.teacher_id = auth.uid()
    )
  );

create policy "Anyone can insert submissions (for students)"
  on public.attendance_submissions for insert
  with check (true); -- Students don't need auth, but we verify via QR token

create policy "Teachers can update submissions for their sessions"
  on public.attendance_submissions for update
  using (
    exists (
      select 1 from public.sessions
      where sessions.id = attendance_submissions.session_id
      and sessions.teacher_id = auth.uid()
    )
  );

-- Function to automatically clean up expired sessions
create or replace function cleanup_expired_sessions()
returns void
language plpgsql
security definer
as $$
begin
  update public.sessions
  set is_active = false
  where expires_at < now() and is_active = true;
end;
$$;

