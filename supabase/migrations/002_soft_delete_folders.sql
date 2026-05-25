








alter table folders
  add column deleted_at timestamptz default null;



create index idx_folders_active
  on folders(deleted_at)
  where deleted_at is null;









create or replace view active_folders
with (security_invoker = on)
as
  select
    id,
    user_id,
    name,
    parent_id,
    sort_order,
    created_at,
    updated_at
  from folders
  where deleted_at is null;


comment on column folders.deleted_at is 'Soft delete timestamp. NULL = active, set = deleted. All app queries must filter WHERE deleted_at IS NULL.';
