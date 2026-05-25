
export interface FolderRow {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}


export interface FolderNode {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  createdAt: string;
  children: FolderNode[];
}
