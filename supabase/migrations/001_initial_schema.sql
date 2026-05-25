












create extension if not exists pg_trgm;





create table folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  parent_id uuid references folders(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);





create table notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid not null references folders(id) on delete cascade,
  title text not null,
  content text not null default '',
  language_tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);





create index idx_folders_parent_id on folders(parent_id);  
create index idx_folders_user_id on folders(user_id);       


create index idx_notes_folder_id on notes(folder_id);         
create index idx_notes_user_id on notes(user_id);             
create index idx_notes_updated_at on notes(updated_at desc);  


create index idx_notes_title on notes using gin(title gin_trgm_ops);            
create index idx_notes_language_tags on notes using gin(language_tags);         




alter table folders enable row level security;
alter table notes enable row level security;









create policy "Users can view their own folders"
  on folders for select
  to authenticated
  using (auth.uid() = user_id);


create policy "Users can insert their own folders"
  on folders for insert
  to authenticated
  with check (auth.uid() = user_id);


create policy "Users can update their own folders"
  on folders for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


create policy "Users can delete their own folders"
  on folders for delete
  to authenticated
  using (auth.uid() = user_id);


create policy "Users can view their own notes"
  on notes for select
  to authenticated
  using (auth.uid() = user_id);


create policy "Users can insert their own notes"
  on notes for insert
  to authenticated
  with check (auth.uid() = user_id);


create policy "Users can update their own notes"
  on notes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


create policy "Users can delete their own notes"
  on notes for delete
  to authenticated
  using (auth.uid() = user_id);








create or replace function set_user_id()
returns trigger as $$
begin
  new.user_id := auth.uid();
  return new;
end;
$$ language plpgsql security definer;

create trigger set_user_id_folders
  before insert on folders
  for each row execute function set_user_id();

create trigger set_user_id_notes
  before insert on notes
  for each row execute function set_user_id();



create or replace function test_rls()
returns text as $$
begin
  if exists (
    select 1 from pg_policies
    where tablename in ('folders', 'notes')
    and permissive = 'PERMISSIVE'
  ) then
    return 'RLS is configured with ' || (
      select count(*)::text from pg_policies
      where tablename in ('folders', 'notes')
    ) || ' policies';
  else
    return 'WARNING: No RLS policies found';
  end if;
end;
$$ language plpgsql;



































