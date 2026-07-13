-- Rotina & Bem-estar — schema para Supabase Postgres.
-- Rode este script uma vez em Project → SQL Editor → New query → Run.
-- RLS fica habilitada sem policies em todas as tabelas: só a service_role key
-- (usada exclusivamente pelo backend) consegue ler/escrever; a chave anon/public
-- fica sem nenhum acesso, mesmo que algum dia seja exposta por engano.

create table if not exists users (
  id text primary key,
  name text not null,
  email text not null unique
);

create table if not exists meal_options (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  meal_type text not null check (meal_type in ('cafe','lancheManha','lancheTarde','jantar')),
  name text not null,
  sort_order integer not null default 0
);

create table if not exists workouts (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  name text not null,
  subtitle text not null default '',
  day_of_week integer,
  time text not null default '07:00',
  cardio_modality text not null default '',
  cardio_duration text not null default '',
  cardio_extra text not null default '',
  notes text not null default '',
  sort_order integer not null default 0
);

create table if not exists workout_warmup_items (
  id text primary key,
  workout_id text not null references workouts(id) on delete cascade,
  text text not null,
  sort_order integer not null default 0
);

create table if not exists workout_stretch_items (
  id text primary key,
  workout_id text not null references workouts(id) on delete cascade,
  text text not null,
  photo_url text,
  sort_order integer not null default 0
);

create table if not exists workout_core_items (
  id text primary key,
  workout_id text not null references workouts(id) on delete cascade,
  text text not null,
  photo_url text,
  sort_order integer not null default 0
);

create table if not exists workout_exercises (
  id text primary key,
  workout_id text not null references workouts(id) on delete cascade,
  name text not null,
  sets text not null default '',
  reps text not null default '',
  load text not null default '',
  note text not null default '',
  photo_url text,
  sort_order integer not null default 0
);

create table if not exists day_blocks (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  day_of_week integer not null,
  time text not null,
  type text not null check (type in ('plain','meal','lunch')),
  label text not null default '',
  meal_type text,
  sort_order integer not null default 0
);

create table if not exists day_selections (
  user_id text not null references users(id) on delete cascade,
  day_of_week integer not null,
  cafe_selected_id text,
  lanche_manha_selected_id text,
  lanche_tarde_selected_id text,
  jantar_selected_id text,
  almoco_checked boolean not null default false,
  primary key (user_id, day_of_week)
);

create table if not exists completions (
  user_id text not null references users(id) on delete cascade,
  workout_id text not null,
  section text not null check (section in ('stretches','exercises')),
  item_id text not null,
  date text not null,
  primary key (user_id, workout_id, section, item_id, date)
);

create table if not exists goals (
  user_id text primary key references users(id) on delete cascade,
  project text not null,
  water text not null,
  protein text not null
);

create table if not exists goals_timeline (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  month text not null,
  foco text not null,
  sort_order integer not null default 0
);

alter table users enable row level security;
alter table meal_options enable row level security;
alter table workouts enable row level security;
alter table workout_warmup_items enable row level security;
alter table workout_stretch_items enable row level security;
alter table workout_core_items enable row level security;
alter table workout_exercises enable row level security;
alter table day_blocks enable row level security;
alter table day_selections enable row level security;
alter table completions enable row level security;
alter table goals enable row level security;
alter table goals_timeline enable row level security;
