-- ============================================================
-- Health Tracker — Supabase Schema
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ============================================================
-- CLEANUP — Drop everything for a clean slate
-- ============================================================

-- Drop triggers on auth.users (created by handle_new_user)
drop trigger if exists on_auth_user_created on auth.users;

-- Drop functions (in reverse dependency order)
drop function if exists handle_new_user();
drop function if exists update_updated_at();

-- Drop all tables (with CASCADE to drop triggers and policies)
drop table if exists workout_sets cascade;
drop table if exists workout_exercises cascade;
drop table if exists workouts cascade;
drop table if exists lab_results cascade;
drop table if exists body_scans cascade;
drop table if exists daily_logs cascade;
drop table if exists profiles cascade;

-- ── Helpers ──────────────────────────────────────────────────
create function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  email           text unique,
  username        text unique,
  full_name       text,
  avatar_url      text,
  date_of_birth   date,
  height_cm       numeric(5, 1),
  sex             text check (sex in ('male', 'female', 'other', 'prefer_not_to_say')),
  units           text not null default 'metric' check (units in ('metric', 'imperial')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can delete own profile"
  on profiles for delete using (auth.uid() = id);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- DAILY LOGS
-- ============================================================
create table if not exists daily_logs (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  log_date        date not null,
  weight_kg       numeric(5, 2),
  body_fat_pct    numeric(4, 1),
  calories_in     integer,
  protein_g       numeric(6, 1),
  carbs_g         numeric(6, 1),
  fat_g           numeric(6, 1),
  water_ml        integer,
  steps           integer,
  workout_type    text,
  sleep_hours     numeric(4, 1),
  sleep_quality   integer check (sleep_quality between 1 and 10),
  energy_level    integer check (energy_level between 1 and 10),
  mood            integer check (mood between 1 and 10),
  stress_level    integer check (stress_level between 1 and 10),
  resting_hr      integer,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, log_date)
);

create index daily_logs_user_date_idx on daily_logs (user_id, log_date desc);

create trigger daily_logs_updated_at
  before update on daily_logs
  for each row execute function update_updated_at();

alter table daily_logs enable row level security;

create policy "Users can view own daily logs"
  on daily_logs for select using (auth.uid() = user_id);

create policy "Users can insert own daily logs"
  on daily_logs for insert with check (auth.uid() = user_id);

create policy "Users can update own daily logs"
  on daily_logs for update using (auth.uid() = user_id);

create policy "Users can delete own daily logs"
  on daily_logs for delete using (auth.uid() = user_id);

-- ============================================================
-- WORKOUTS
-- ============================================================
create table if not exists workouts (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  name            text not null,
  notes           text,
  started_at      timestamptz not null default now(),
  ended_at        timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index workouts_user_started_idx on workouts (user_id, started_at desc);

create trigger workouts_updated_at
  before update on workouts
  for each row execute function update_updated_at();

alter table workouts enable row level security;

create policy "Users can view own workouts"
  on workouts for select using (auth.uid() = user_id);

create policy "Users can insert own workouts"
  on workouts for insert with check (auth.uid() = user_id);

create policy "Users can update own workouts"
  on workouts for update using (auth.uid() = user_id);

create policy "Users can delete own workouts"
  on workouts for delete using (auth.uid() = user_id);

-- ============================================================
-- WORKOUT EXERCISES
-- ============================================================
create table if not exists workout_exercises (
  id              uuid primary key default uuid_generate_v4(),
  workout_id      uuid not null references workouts (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  exercise_name   text not null,
  category        text check (category in (
                    'strength', 'cardio', 'flexibility',
                    'balance', 'plyometrics', 'other'
                  )),
  muscle_group    text,
  equipment       text,
  position        integer not null default 0,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index workout_exercises_workout_idx on workout_exercises (workout_id, position);

create trigger workout_exercises_updated_at
  before update on workout_exercises
  for each row execute function update_updated_at();

alter table workout_exercises enable row level security;

create policy "Users can view own workout exercises"
  on workout_exercises for select using (auth.uid() = user_id);

create policy "Users can insert own workout exercises"
  on workout_exercises for insert with check (auth.uid() = user_id);

create policy "Users can update own workout exercises"
  on workout_exercises for update using (auth.uid() = user_id);

create policy "Users can delete own workout exercises"
  on workout_exercises for delete using (auth.uid() = user_id);

-- ============================================================
-- WORKOUT SETS
-- ============================================================
create table if not exists workout_sets (
  id                  uuid primary key default uuid_generate_v4(),
  workout_exercise_id uuid not null references workout_exercises (id) on delete cascade,
  user_id             uuid not null references auth.users (id) on delete cascade,
  set_number          integer not null,
  set_type            text not null default 'working' check (set_type in (
                        'warmup', 'working', 'drop', 'failure', 'rest_pause'
                      )),
  reps                integer,
  weight_kg           numeric(6, 2),
  duration_sec        integer,        -- for timed sets / cardio
  distance_m          numeric(8, 2),  -- for cardio
  rpe                 numeric(3, 1) check (rpe between 1 and 10),
  rest_sec            integer,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index workout_sets_exercise_idx on workout_sets (workout_exercise_id, set_number);

create trigger workout_sets_updated_at
  before update on workout_sets
  for each row execute function update_updated_at();

alter table workout_sets enable row level security;

create policy "Users can view own workout sets"
  on workout_sets for select using (auth.uid() = user_id);

create policy "Users can insert own workout sets"
  on workout_sets for insert with check (auth.uid() = user_id);

create policy "Users can update own workout sets"
  on workout_sets for update using (auth.uid() = user_id);

create policy "Users can delete own workout sets"
  on workout_sets for delete using (auth.uid() = user_id);

-- ============================================================
-- BODY SCANS
-- ============================================================
create table if not exists body_scans (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  scanned_at      timestamptz not null default now(),
  -- circumferences (cm)
  neck_cm         numeric(5, 1),
  chest_cm        numeric(5, 1),
  left_bicep_cm   numeric(5, 1),
  right_bicep_cm  numeric(5, 1),
  waist_cm        numeric(5, 1),
  hips_cm         numeric(5, 1),
  left_thigh_cm   numeric(5, 1),
  right_thigh_cm  numeric(5, 1),
  left_calf_cm    numeric(5, 1),
  right_calf_cm   numeric(5, 1),
  -- skinfolds (mm) — for calipers
  chest_sf_mm     numeric(4, 1),
  abdomen_sf_mm   numeric(4, 1),
  thigh_sf_mm     numeric(4, 1),
  -- composition
  body_fat_pct    numeric(4, 1),
  lean_mass_kg    numeric(5, 2),
  fat_mass_kg     numeric(5, 2),
  bone_mass_kg    numeric(5, 2),
  water_pct       numeric(4, 1),
  visceral_fat    numeric(4, 1),
  -- source
  method          text check (method in (
                    'dexa', 'bod_pod', 'hydrostatic', 'mri',
                    'bioimpedance', 'calipers', 'visual', 'other'
                  )),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index body_scans_user_date_idx on body_scans (user_id, scanned_at desc);

create trigger body_scans_updated_at
  before update on body_scans
  for each row execute function update_updated_at();

alter table body_scans enable row level security;

create policy "Users can view own body scans"
  on body_scans for select using (auth.uid() = user_id);

create policy "Users can insert own body scans"
  on body_scans for insert with check (auth.uid() = user_id);

create policy "Users can update own body scans"
  on body_scans for update using (auth.uid() = user_id);

create policy "Users can delete own body scans"
  on body_scans for delete using (auth.uid() = user_id);

-- ============================================================
-- LAB RESULTS
-- ============================================================
create table if not exists lab_results (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  tested_at       date not null,
  panel_name      text,              -- e.g. "Comprehensive Metabolic Panel"
  -- lipids
  total_chol      numeric(5, 1),    -- mg/dL
  ldl             numeric(5, 1),
  hdl             numeric(5, 1),
  triglycerides   numeric(5, 1),
  -- glucose / insulin
  glucose         numeric(5, 1),
  hba1c           numeric(4, 1),    -- %
  insulin         numeric(6, 2),    -- µIU/mL
  -- thyroid
  tsh             numeric(6, 3),    -- µIU/mL
  free_t3         numeric(5, 2),    -- pg/mL
  free_t4         numeric(5, 2),    -- ng/dL
  -- hormones
  testosterone    numeric(7, 1),    -- ng/dL
  free_test       numeric(6, 2),    -- pg/mL
  estradiol       numeric(6, 1),    -- pg/mL
  shbg            numeric(6, 1),    -- nmol/L
  dhea_s          numeric(6, 1),    -- µg/dL
  cortisol        numeric(5, 1),    -- µg/dL
  -- CBC
  rbc             numeric(5, 2),    -- M/µL
  wbc             numeric(5, 2),    -- K/µL
  hemoglobin      numeric(4, 1),    -- g/dL
  hematocrit      numeric(4, 1),    -- %
  platelets       numeric(6, 0),    -- K/µL
  -- metabolic
  sodium          numeric(4, 0),    -- mEq/L
  potassium       numeric(4, 2),
  creatinine      numeric(4, 2),    -- mg/dL
  egfr            numeric(5, 0),    -- mL/min/1.73m²
  bun             numeric(4, 0),    -- mg/dL
  alt             numeric(5, 0),    -- U/L
  ast             numeric(5, 0),
  albumin         numeric(4, 1),    -- g/dL
  -- vitamins / minerals
  vitamin_d       numeric(5, 1),    -- ng/mL
  vitamin_b12     numeric(6, 0),    -- pg/mL
  ferritin        numeric(7, 1),    -- ng/mL
  iron            numeric(5, 0),    -- µg/dL
  -- inflammation
  crp             numeric(6, 2),    -- mg/L
  homocysteine    numeric(5, 1),    -- µmol/L
  -- extra fields as JSON for anything not listed above
  extra           jsonb,
  lab_name        text,
  ordering_physician text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index lab_results_user_date_idx on lab_results (user_id, tested_at desc);

create trigger lab_results_updated_at
  before update on lab_results
  for each row execute function update_updated_at();

alter table lab_results enable row level security;

create policy "Users can view own lab results"
  on lab_results for select using (auth.uid() = user_id);

create policy "Users can insert own lab results"
  on lab_results for insert with check (auth.uid() = user_id);

create policy "Users can update own lab results"
  on lab_results for update using (auth.uid() = user_id);

create policy "Users can delete own lab results"
  on lab_results for delete using (auth.uid() = user_id);
