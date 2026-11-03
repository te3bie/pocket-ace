begin;
create table public.bank_link_sessions(link_token text primary key,user_id uuid not null references auth.users(id) on delete cascade,expires_at timestamptz not null,completed boolean not null default false);
create index bank_link_sessions_owner on public.bank_link_sessions(user_id,expires_at);
alter table public.bank_link_sessions enable row level security;
-- No client policy: tokens are backend-only.
commit;
