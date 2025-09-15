-- Migration: persist item change events (added, increased)
-- Safe to re-run.

-- 1) Create table for item events
create table if not exists public.item_events (
  id uuid primary key default gen_random_uuid(),
  item_id uuid null references public.items(id) on delete set null,
  item_name text not null,
  type text not null check (type in ('added','increased')),
  amount int not null check (amount > 0),
  new_qty int not null check (new_qty >= 0),
  created_at timestamptz not null default now()
);

-- Helpful index for recency queries
create index if not exists idx_item_events_created_at on public.item_events(created_at desc);

-- 2) RLS policy: allow anyone with access to select (read-only)
alter table public.item_events enable row level security;
drop policy if exists "read item_events" on public.item_events;
create policy "read item_events" on public.item_events for select using (true);

-- 3) Trigger function to log events on items insert/update
create or replace function public.log_item_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    -- Skip logging when starting quantity is zero to avoid noisy events
    if coalesce(new.quantity, 0) > 0 then
      insert into public.item_events (item_id, item_name, type, amount, new_qty, created_at)
      values (new.id, new.name, 'added', coalesce(new.quantity, 0), coalesce(new.quantity, 0), new.created_at);
    end if;
    return new;
  elsif tg_op = 'UPDATE' then
    if coalesce(new.quantity, 0) > coalesce(old.quantity, 0) then
      insert into public.item_events (item_id, item_name, type, amount, new_qty)
      values (new.id, new.name, 'increased', coalesce(new.quantity, 0) - coalesce(old.quantity, 0), coalesce(new.quantity, 0));
    end if;
    return new;
  end if;
  return new;
end;
$$;

-- 4) Single trigger to handle both insert and update on items
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_items_log_events'
  ) then
    create trigger trg_items_log_events
    after insert or update on public.items
    for each row execute function public.log_item_events();
  end if;
end $$;
