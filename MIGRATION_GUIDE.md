# Database Migration Guide

## Quick Fix: Run the Migration

You need to create the `sessions` and `attendance_submissions` tables in your Supabase database.

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (in the left sidebar)
3. Click **New Query**
4. Copy and paste the entire contents of `scripts/002_add_sessions_and_submissions.sql`
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned"

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db push
```

Or manually:

```bash
psql -h <your-supabase-host> -U postgres -d postgres -f scripts/002_add_sessions_and_submissions.sql
```

### Option 3: Quick SQL (Copy-Paste Ready)

Here's the complete SQL to run:

```sql
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
  selfie_image text,
  liveness_action text,
  verified boolean default false,
  qr_token_hash text,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(session_id, student_id)
);

-- Create indexes
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
  with check (true);

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
```

## Verify Migration

After running the migration, verify the tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sessions', 'attendance_submissions');
```

You should see both tables listed.

## Troubleshooting

### Error: "relation 'public.profiles' does not exist"
- Make sure you've run `scripts/001_create_schema.sql` first
- This creates the `profiles`, `classes`, and `students` tables

### Error: "permission denied"
- Make sure you're running the SQL as a user with proper permissions
- In Supabase Dashboard, you should have admin access

### Error: "policy already exists"
- This is fine - the `if not exists` clauses will handle it
- You can ignore duplicate policy errors

