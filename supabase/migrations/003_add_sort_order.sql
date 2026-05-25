
alter table notes
  add column sort_order integer not null default 0;

create index idx_notes_sort_order on notes(sort_order);



create or replace function batch_reorder_folders(updates jsonb)
returns void as $$
begin
  with reorder as (
    select
      (item ->> 'id')::uuid as id,
      (item ->> 'sort_order')::integer as sort_order
    from jsonb_array_elements(updates) as item
  )
  update folders f
  set sort_order = r.sort_order,
      updated_at = now()
  from reorder r
  where f.id = r.id;
end;
$$ language plpgsql security definer;


create or replace function batch_reorder_notes(updates jsonb)
returns void as $$
begin
  with reorder as (
    select
      (item ->> 'id')::uuid as id,
      (item ->> 'sort_order')::integer as sort_order
    from jsonb_array_elements(updates) as item
  )
  update notes n
  set sort_order = r.sort_order,
      updated_at = now()
  from reorder r
  where n.id = r.id;
end;
$$ language plpgsql security definer;
