-- Migration: skip logging zero-quantity 'added' events
-- Rationale: allow inserting items with quantity = 0 without violating
--            item_events amount > 0 check, and avoid noisy 0-qty events.
-- Idempotent and safe to re-run.

-- Keep existing constraint (amount > 0). Only adjust trigger function.

create or replace function public.log_item_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    -- Only log when starting quantity is > 0
    if coalesce(new.quantity, 0) > 0 then
      insert into public.item_events (item_id, item_name, type, amount, new_qty, created_at)
      values (new.id, new.name, 'added', coalesce(new.quantity, 0), coalesce(new.quantity, 0), new.created_at);
    end if;
    return new;
  elsif tg_op = 'UPDATE' then
    -- Log increases only (delta > 0)
    if coalesce(new.quantity, 0) > coalesce(old.quantity, 0) then
      insert into public.item_events (item_id, item_name, type, amount, new_qty)
      values (new.id, new.name, 'increased', coalesce(new.quantity, 0) - coalesce(old.quantity, 0), coalesce(new.quantity, 0));
    end if;
    return new;
  end if;
  return new;
end;
$$;

