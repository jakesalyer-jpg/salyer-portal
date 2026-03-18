-- ============================================================
-- RIDGELINE HOMES — CONSTRUCTION PORTAL DATABASE SCHEMA
-- Run this in Supabase SQL Editor (Project → SQL Editor → New query)
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create type user_role as enum ('admin', 'client', 'subcontractor');

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  phone text,
  role user_role not null default 'client',
  company_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Profiles: users can read their own, admins can read all
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can update all profiles"
  on public.profiles for update
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'client')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- PROJECTS
-- ============================================================
create type project_status as enum ('pre_construction', 'active', 'on_hold', 'completed');

create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text not null,
  client_id uuid references public.profiles(id) on delete set null,
  status project_status not null default 'active',
  start_date date,
  estimated_completion date,
  actual_completion date,
  contract_value numeric(12,2),
  description text,
  cover_image_url text,
  progress_percent integer default 0 check (progress_percent >= 0 and progress_percent <= 100),
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.projects enable row level security;

create policy "Clients can view their own projects"
  on public.projects for select
  using (client_id = auth.uid());

create policy "Admins can do everything on projects"
  on public.projects for all
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- ============================================================
-- PROJECT PHASES
-- ============================================================
create table public.project_phases (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  description text,
  sort_order integer not null default 0,
  start_date date,
  end_date date,
  status text not null default 'pending' check (status in ('pending', 'active', 'completed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.project_phases enable row level security;

create policy "Clients can view phases of their projects"
  on public.project_phases for select
  using (exists (
    select 1 from public.projects where id = project_id and client_id = auth.uid()
  ));

create policy "Admins can do everything on phases"
  on public.project_phases for all
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- ============================================================
-- TASKS (within phases)
-- ============================================================
create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade not null,
  phase_id uuid references public.project_phases(id) on delete set null,
  name text not null,
  description text,
  due_date date,
  completed_date date,
  is_completed boolean default false,
  sort_order integer default 0,
  assigned_to uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tasks enable row level security;

create policy "Clients can view tasks of their projects"
  on public.tasks for select
  using (exists (
    select 1 from public.projects where id = project_id and client_id = auth.uid()
  ));

create policy "Admins can do everything on tasks"
  on public.tasks for all
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- ============================================================
-- SELECTIONS (design choices clients need to make)
-- ============================================================
create type selection_status as enum ('pending', 'submitted', 'approved', 'revision_needed');

create table public.selections (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade not null,
  category text not null,
  item_name text not null,
  description text,
  deadline date,
  status selection_status not null default 'pending',
  client_choice text,
  client_notes text,
  builder_notes text,
  sort_order integer default 0,
  submitted_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.selections enable row level security;

create policy "Clients can view and update their project selections"
  on public.selections for select
  using (exists (
    select 1 from public.projects where id = project_id and client_id = auth.uid()
  ));

create policy "Clients can update their selections"
  on public.selections for update
  using (exists (
    select 1 from public.projects where id = project_id and client_id = auth.uid()
  ));

create policy "Admins can do everything on selections"
  on public.selections for all
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- ============================================================
-- DOCUMENTS
-- ============================================================
create type document_category as enum (
  'contract', 'change_order', 'plans', 'permit', 'inspection',
  'warranty', 'invoice', 'photo', 'other'
);

create table public.documents (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  category document_category not null default 'other',
  file_url text not null,
  file_size bigint,
  file_type text,
  description text,
  visible_to_client boolean default true,
  visible_to_subs boolean default false,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.documents enable row level security;

create policy "Clients can view their project documents"
  on public.documents for select
  using (
    visible_to_client = true and
    exists (
      select 1 from public.projects where id = project_id and client_id = auth.uid()
    )
  );

create policy "Admins can do everything on documents"
  on public.documents for all
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- ============================================================
-- ANNOUNCEMENTS (builder → client updates)
-- ============================================================
create table public.announcements (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  body text not null,
  icon text default '📋',
  is_urgent boolean default false,
  published boolean default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.announcements enable row level security;

create policy "Clients can view announcements for their projects"
  on public.announcements for select
  using (
    published = true and
    exists (
      select 1 from public.projects where id = project_id and client_id = auth.uid()
    )
  );

create policy "Admins can do everything on announcements"
  on public.announcements for all
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- ============================================================
-- MILESTONES
-- ============================================================
create table public.milestones (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  description text,
  due_date date not null,
  completed_date date,
  is_completed boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now()
);

alter table public.milestones enable row level security;

create policy "Clients can view milestones for their projects"
  on public.milestones for select
  using (exists (
    select 1 from public.projects where id = project_id and client_id = auth.uid()
  ));

create policy "Admins can do everything on milestones"
  on public.milestones for all
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- ============================================================
-- SUBCONTRACTORS (junction: subs assigned to projects)
-- ============================================================
create table public.project_subcontractors (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade not null,
  subcontractor_id uuid references public.profiles(id) on delete cascade not null,
  trade text,
  notes text,
  created_at timestamptz default now(),
  unique(project_id, subcontractor_id)
);

alter table public.project_subcontractors enable row level security;

create policy "Subs can view their project assignments"
  on public.project_subcontractors for select
  using (subcontractor_id = auth.uid());

create policy "Admins can do everything on project_subcontractors"
  on public.project_subcontractors for all
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- ============================================================
-- UPDATED_AT triggers
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.projects
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.project_phases
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.tasks
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.selections
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.announcements
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- STORAGE BUCKETS (run separately in Supabase dashboard)
-- Or via SQL:
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('documents', 'documents', false);
-- insert into storage.buckets (id, name, public) values ('photos', 'photos', false);
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
