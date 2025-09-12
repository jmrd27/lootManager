-- Migration: global ordering for items via position column + reorder function
-- Safe to re-run.

-- 1) Add position column if missing
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='items' and column_name='position'
  ) then
    alter table public.items add column position int not null default 0;
  end if;
end $$;

-- 2) Backfill positions if all zeros
with any_pos as (
  select count(*) as c from public.items where position <> 0
)
update public.items i
set position = r.pos
from (
  select id, row_number() over (order by created_at asc) as pos
  from public.items
) r, any_pos ap
where i.id = r.id and ap.c = 0;

-- 3) Helpful index
create index if not exists idx_items_position on public.items(position asc);

-- 4) Reorder function (caller must have update permission via RLS)
create or replace function public.reorder_items(ids uuid[])
returns void
language sql
security invoker
as $$
  with ord as (
    select unnest(ids) as id, generate_series(1, array_length(ids,1)) as pos
  )
  update public.items i
  set position = o.pos
  from ord o
  where i.id = o.id;
$$;

