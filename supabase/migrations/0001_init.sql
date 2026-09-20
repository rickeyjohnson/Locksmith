-- Locksmith schema. Run this in the Supabase SQL editor.
-- Row-level security is on with no policies, so only the secret (service_role)
-- key used by the Next.js server can read or write these tables.

create table if not exists players (
  id uuid primary key,
  nickname text,
  consented_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists attempts (
  id uuid primary key,
  player_id uuid not null,
  level_id int not null,
  attempt_no int not null,
  prompt text not null,
  raw_model_response text,
  shown_response text not null,
  status text not null check (status in ('ok', 'blocked', 'error')),
  blocked_by text,
  guard_trace jsonb,
  leaked boolean not null,
  raw_leaked boolean not null,
  latency_ms int not null,
  model text not null,
  config_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists guesses (
  id uuid primary key,
  player_id uuid not null,
  level_id int not null,
  guess text not null,
  correct boolean not null,
  attempts_before int not null,
  created_at timestamptz not null default now()
);

create index if not exists attempts_player_level on attempts (player_id, level_id);
create index if not exists guesses_player on guesses (player_id);

alter table players enable row level security;
alter table attempts enable row level security;
alter table guesses enable row level security;
