-- Run this in the Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/uvdwytgomcipecuxhtik/sql

create table if not exists adventure_profiles (
  id                    uuid primary key default gen_random_uuid(),
  session_id            text,
  plan_number           integer default 1,
  created_at_utc        timestamptz default now(),
  caller_timezone       text,
  created_at_local      text,
  user_id               uuid references auth.users(id) on delete set null,
  name                  text,
  age                   integer,
  home_city             text,
  adventure_sport       text,
  planned_location      text,
  fitness_level         text,
  certifications        text,
  driving_license_type  text,
  license_issued_in     text,
  idp_required          boolean default false,
  preferred_currency    text,
  budget                numeric,
  available_days        integer,
  risk_tolerance        text,
  experience_notes      text,
  status                text default 'complete',
  transcript            text
);

-- RLS: users can only read/insert their own rows
alter table adventure_profiles enable row level security;

create policy "Users can insert own adventure profiles"
  on adventure_profiles for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "Users can read own adventure profiles"
  on adventure_profiles for select
  using (auth.uid() = user_id);
