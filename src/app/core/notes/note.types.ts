
export interface NoteRow {
  id: string;
  user_id: string;
  folder_id: string;
  title: string;
  content: string;
  language_tags: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}


export interface NoteNode {
  id: string;
  folderId: string;
  title: string;
  content: string;
  languageTags: string[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}


export interface DraftState {
  title: string;
  content: string;
  isDirty: boolean;
  lastSavedAt: string | null;
}
