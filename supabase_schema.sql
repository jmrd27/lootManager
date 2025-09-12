-- Items table
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  quantity int not null default 1,
  date_iso text not null default to_char(current_date, 'YYYY-MM-DD'),
  created_at timestamptz not null default now()
);

-- Requests table
create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  member_name text not null,
  quantity int not null default 1,
  created_at timestamptz not null default now()
);

-- Recommended indexes
create index if not exists idx_requests_item on public.requests(item_id);
create index if not exists idx_items_created_at on public.items(created_at desc);

-- Enable Row Level Security
alter table public.items enable row level security;
alter table public.requests enable row level security;

-- Policies (adjust as needed)
-- For a simple shared app where anyone with the link can contribute, allow anon reads/writes.
-- If you want to restrict to authenticated users, replace 'public' with 'authenticated' and configure auth.

drop policy if exists "allow all read items" on public.items;
create policy "allow all read items" on public.items for select using (true);

-- Restrict writes on items to leaders only
drop policy if exists "allow all write items" on public.items;
drop policy if exists "leader insert items" on public.items;
drop policy if exists "leader update items" on public.items;
drop policy if exists "leader delete items" on public.items;
create policy "leader insert items" on public.items for insert
  with check (public.is_leader(auth.uid()));
create policy "leader update items" on public.items for update
  using (public.is_leader(auth.uid()))
  with check (public.is_leader(auth.uid()));
create policy "leader delete items" on public.items for delete
  using (public.is_leader(auth.uid()));

drop policy if exists "allow all read requests" on public.requests;
create policy "allow all read requests" on public.requests for select using (true);

-- Restrict writes on requests: only approved users can insert; owner or leader can delete/update
drop policy if exists "allow all write requests" on public.requests;
drop policy if exists "approved can insert requests" on public.requests;
drop policy if exists "owner or leader delete requests" on public.requests;
drop policy if exists "owner or leader update requests" on public.requests;
create policy "approved can insert requests" on public.requests for insert
  with check (
    requester_id = auth.uid() and
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.approved = true)
  );
create policy "owner or leader delete requests" on public.requests for delete
  using (requester_id = auth.uid() or public.is_leader(auth.uid()));
create policy "owner or leader update requests" on public.requests for update
  using (requester_id = auth.uid() or public.is_leader(auth.uid()))
  with check (requester_id = auth.uid() or public.is_leader(auth.uid()));

-- === Auth, Profiles, and Roles ===
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 32),
  role text not null default 'member' check (role in ('member','leader')),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Helper to check leader role without triggering recursive RLS lookups
create or replace function public.is_leader(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = uid and role = 'leader'
  );
$$;

grant execute on function public.is_leader(uuid) to anon, authenticated;

-- Profiles policies
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles leader read all" on public.profiles;
create policy "profiles leader read all" on public.profiles for select using (public.is_leader(auth.uid()));

drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self insert" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "profiles leader update" on public.profiles;
create policy "profiles leader update" on public.profiles for update using (public.is_leader(auth.uid())) with check (public.is_leader(auth.uid()));

-- Tighten items/requests when ready (commented defaults kept for quick start)
-- Example hardened policies (enable once you want restrictions):
-- drop policy if exists "allow all write items" on public.items;
-- create policy "leader write items" on public.items for all
--   using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'leader'))
--   with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'leader'));

-- Add requester_id for ownership and better RLS
do $$ begin
  if not exists (
    select 1 from information_schema.columns where table_schema='public' and table_name='requests' and column_name='requester_id'
  ) then
    alter table public.requests add column requester_id uuid references auth.users(id);
    create index if not exists idx_requests_requester on public.requests(requester_id);
  end if;
end $$;

-- === Assignments ===
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  assignee_id uuid references auth.users(id),
  assignee_name text not null,
  quantity int not null default 1 check (quantity > 0),
  assigned_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_assign_item on public.assignments(item_id);
create index if not exists idx_assign_assignee on public.assignments(assignee_id);

alter table public.assignments enable row level security;

-- Read for everyone (adjust to authenticated if desired)
drop policy if exists "assignments read" on public.assignments;
create policy "assignments read" on public.assignments for select using (true);

-- Only leaders can write assignments
drop policy if exists "assignments leader insert" on public.assignments;
drop policy if exists "assignments leader update" on public.assignments;
drop policy if exists "assignments leader delete" on public.assignments;
create policy "assignments leader insert" on public.assignments for insert
  with check (public.is_leader(auth.uid()));
create policy "assignments leader update" on public.assignments for update
  using (public.is_leader(auth.uid())) with check (public.is_leader(auth.uid()));
create policy "assignments leader delete" on public.assignments for delete
  using (public.is_leader(auth.uid()));

-- Example request policies (enable when ready):
-- drop policy if exists "allow all write requests" on public.requests;
-- create policy "approved can write requests" on public.requests for insert
--   with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.approved = true));
-- create policy "owner or leader delete requests" on public.requests for delete
--   using (requester_id = auth.uid() or public.is_leader(auth.uid()));

-- Enforce settings.requests_enabled at the DB layer for request inserts
do $$ begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'requests'
  ) then
    drop policy if exists "approved can insert requests" on public.requests;
    create policy "approved can insert requests" on public.requests for insert
      with check (
        requester_id = auth.uid()
        and exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.approved = true
        )
        and exists (
          select 1 from public.settings s
          where s.id = 1 and s.requests_enabled = true
        )
      );
  end if;
end $$;

-- === Global Settings ===
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  requests_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

drop policy if exists "settings read" on public.settings;
create policy "settings read" on public.settings for select using (true);

drop policy if exists "settings leader write" on public.settings;
create policy "settings leader write" on public.settings for insert
  with check (public.is_leader(auth.uid()));

drop policy if exists "settings leader update" on public.settings;
create policy "settings leader update" on public.settings for update
  using (public.is_leader(auth.uid())) with check (public.is_leader(auth.uid()));

-- Ensure Realtime publication tracks settings (ignore if already added)
do $$
begin
  begin
    alter publication supabase_realtime add table public.settings;
  exception when duplicate_object then
    null;
  end;
end $$;
