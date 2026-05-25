import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { NoteRow } from './note.types';

@Injectable({ providedIn: 'root' })
export class NoteService {
  private supabase = inject(SupabaseService).supabase;

  
  async fetchNotes(folderId?: string | null): Promise<{ data?: NoteRow[]; error?: string }> {
    let query = this.supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false });

    if (folderId) {
      query = query.eq('folder_id', folderId);
    }

    const { data, error } = await query;

    if (error) return { error: error.message };
    return { data };
  }

  
  async fetchNoteById(id: string): Promise<{ data?: NoteRow; error?: string }> {
    const { data, error } = await this.supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return { error: error.message };
    return { data };
  }

  
  async createNote(
    folderId: string,
    title: string,
    content: string = '',
    languageTags: string[] = []
  ): Promise<{ data?: NoteRow; error?: string }> {
    const { data, error } = await this.supabase
      .from('notes')
      .insert({
        folder_id: folderId,
        title: title.trim(),
        content,
        language_tags: languageTags,
      })
      .select()
      .single();

    if (error) return { error: error.message };
    return { data };
  }

  
  async updateNote(
    id: string,
    title: string,
    content: string
  ): Promise<{ error?: string }> {
    const { error } = await this.supabase
      .from('notes')
      .update({
        title: title.trim(),
        content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) return { error: error.message };
    return {};
  }

  
  async updateNoteFolder(
    noteId: string,
    targetFolderId: string
  ): Promise<{ error?: string }> {
    const { error } = await this.supabase
      .from('notes')
      .update({ folder_id: targetFolderId, updated_at: new Date().toISOString() })
      .eq('id', noteId);

    if (error) return { error: error.message };
    return {};
  }

  
  async deleteNote(id: string): Promise<{ error?: string }> {
    const { error } = await this.supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) return { error: error.message };
    return {};
  }

  
  async batchReorderNotes(
    items: { id: string; sort_order: number }[]
  ): Promise<{ error?: string }> {
    const { error } = await this.supabase.rpc('batch_reorder_notes', {
      updates: items,
    });

    if (error) return { error: error.message };
    return {};
  }

  
  async countNotesInFolder(folderId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('folder_id', folderId);

    if (error) return 0;
    return count ?? 0;
  }
}
