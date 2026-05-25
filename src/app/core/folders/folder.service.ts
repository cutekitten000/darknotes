import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { FolderRow } from './folder.types';

@Injectable({ providedIn: 'root' })
export class FolderService {
  private supabase = inject(SupabaseService).supabase;

  
  async fetchFolders(): Promise<{ data?: FolderRow[]; error?: string }> {
    const { data, error } = await this.supabase
      .from('folders')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) return { error: error.message };
    return { data };
  }

  
  async createFolder(
    name: string,
    parentId: string | null
  ): Promise<{ data?: FolderRow; error?: string }> {
    const { data, error } = await this.supabase
      .from('folders')
      .insert({
        name: name.trim(),
        parent_id: parentId,
      })
      .select()
      .single();

    if (error) return { error: error.message };
    return { data };
  }

  
  async renameFolder(
    id: string,
    name: string
  ): Promise<{ error?: string }> {
    const trimmed = name.trim();
    if (!trimmed) return { error: 'O nome da pasta não pode estar vazio.' };

    const { error } = await this.supabase
      .from('folders')
      .update({ name: trimmed, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return { error: error.message };
    return {};
  }

  
  async updateFolderParent(
    id: string,
    parentId: string | null
  ): Promise<{ error?: string }> {
    const { error } = await this.supabase
      .from('folders')
      .update({ parent_id: parentId, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return { error: error.message };
    return {};
  }

  
  async softDeleteFolder(id: string): Promise<{ error?: string }> {
    const { error } = await this.supabase
      .from('folders')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return { error: error.message };
    return {};
  }

  
  async batchReorderFolders(
    items: { id: string; sort_order: number }[]
  ): Promise<{ error?: string }> {
    const { error } = await this.supabase.rpc('batch_reorder_folders', {
      updates: items,
    });

    if (error) return { error: error.message };
    return {};
  }

  
  async getSubfolderCount(folderId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('folders')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', folderId)
      .is('deleted_at', null);

    if (error) return 0;
    return count ?? 0;
  }

  
  async getNoteCount(folderId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('folder_id', folderId);

    if (error) return 0;
    return count ?? 0;
  }
}
