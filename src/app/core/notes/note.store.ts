import { Injectable, signal, computed, inject } from '@angular/core';
import { NoteService } from './note.service';
import { NoteNode, DraftState } from './note.types';
import { FolderStore } from '../folders/folder.store';
import { ToastService } from '../toast/toast.service';

@Injectable({ providedIn: 'root' })
export class NoteStore {
  private noteService = inject(NoteService);
  private folderStore = inject(FolderStore);
  private toastService = inject(ToastService);

  
  readonly notes = signal<NoteNode[]>([]);

  
  readonly selectedNoteId = signal<string | null>(null);

  
  readonly isLoading = signal(false);

  
  readonly isSaving = signal(false);

  
  readonly isCreating = signal(false);

  
  readonly draft = signal<DraftState>({
    title: '',
    content: '',
    isDirty: false,
    lastSavedAt: null,
  });

  
  readonly selectedNote = computed(() => {
    const id = this.selectedNoteId();
    if (!id) return null;
    return this.notes().find((n) => n.id === id) ?? null;
  });

  
  readonly notesBySelectedFolder = computed(() => {
    const folderId = this.folderStore.selectedFolderId();
    if (!folderId) return this.notes();
    return this.notes().filter((n) => n.folderId === folderId);
  });

  
  readonly noteCountByFolder = computed(() => {
    const map = new Map<string, number>();
    for (const note of this.notes()) {
      map.set(note.folderId, (map.get(note.folderId) ?? 0) + 1);
    }
    return map;
  });

  
  readonly noteCount = computed(() => this.notesBySelectedFolder().length);

  
  readonly searchQuery = signal('');

  
  readonly filteredNotes = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.notes();
    return this.notes().filter((n) => n.title.toLowerCase().includes(query));
  });

  
  readonly isDirty = computed(() => this.draft().isDirty);

  
  async loadNotes(): Promise<void> {
    this.isLoading.set(true);
    const { data, error } = await this.noteService.fetchNotes();

    if (error) {
      this.toastService.show('Erro ao carregar notas', 'error');
      this.isLoading.set(false);
      return;
    }

    this.notes.set(
      (data ?? []).map((row) => ({
        id: row.id,
        folderId: row.folder_id,
        title: row.title,
        content: row.content,
        languageTags: row.language_tags ?? [],
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))
    );
    this.isLoading.set(false);
  }

  
  async loadNotesByFolder(folderId: string | null): Promise<void> {
    this.isLoading.set(true);
    const { data, error } = await this.noteService.fetchNotes(folderId);

    if (error) {
      this.toastService.show('Erro ao carregar notas', 'error');
      this.isLoading.set(false);
      return;
    }

    this.notes.set(
      (data ?? []).map((row) => ({
        id: row.id,
        folderId: row.folder_id,
        title: row.title,
        content: row.content,
        languageTags: row.language_tags ?? [],
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))
    );
    this.isLoading.set(false);
  }

  
  async createNote(
    folderId: string,
    title: string,
    languageTags: string[] = []
  ): Promise<{ data?: NoteNode; error?: string }> {
    const trimmed = title.trim();
    if (!trimmed) {
      this.toastService.show('O título da nota não pode estar vazio.', 'error');
      return { error: 'Empty title' };
    }

    const inheritedTags = this.#inheritTagsFromFolder(folderId, languageTags);

    this.isCreating.set(true);
    const { data, error } = await this.noteService.createNote(
      folderId,
      trimmed,
      '',
      inheritedTags
    );

    if (error) {
      this.toastService.show('Erro ao criar nota. Tente novamente.', 'error');
      this.isCreating.set(false);
      return { error };
    }

    if (data) {
      const newNode: NoteNode = {
        id: data.id,
        folderId: data.folder_id,
        title: data.title,
        content: data.content,
        languageTags: data.language_tags ?? [],
        sortOrder: data.sort_order,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      this.notes.update((current) => [...current, newNode]);
      this.isCreating.set(false);
      this.toastService.show(`Nota "${trimmed}" criada`, 'success');
      return { data: newNode };
    }

    this.isCreating.set(false);
    return {};
  }

  
  selectNote(id: string | null): void {
    this.selectedNoteId.set(id);
  }

  
  initDraft(note: NoteNode): void {
    this.draft.set({
      title: note.title,
      content: note.content,
      isDirty: false,
      lastSavedAt: note.updatedAt,
    });
  }

  
  clearDraft(): void {
    this.draft.set({
      title: '',
      content: '',
      isDirty: false,
      lastSavedAt: null,
    });
  }

  
  updateDraftTitle(title: string): void {
    this.draft.update((d) => ({
      ...d,
      title,
      isDirty: true,
    }));
  }

  
  updateDraftContent(content: string): void {
    this.draft.update((d) => ({
      ...d,
      content,
      isDirty: true,
    }));
  }

  
  async saveDraft(): Promise<{ error?: string }> {
    const noteId = this.selectedNoteId();
    if (!noteId) return { error: 'No note selected' };

    const draft = this.draft();
    if (!draft.isDirty) return {}; 

    this.isSaving.set(true);
    const { error } = await this.noteService.updateNote(
      noteId,
      draft.title,
      draft.content
    );

    if (error) {
      this.toastService.show('Erro ao salvar nota. Tente novamente.', 'error');
      this.isSaving.set(false);
      return { error };
    }

    const now = new Date().toISOString();
    this.notes.update((current) =>
      current.map((n) =>
        n.id === noteId
          ? { ...n, title: draft.title, content: draft.content, updatedAt: now }
          : n
      )
    );

    this.draft.update((d) => ({
      ...d,
      isDirty: false,
      lastSavedAt: now,
    }));

    this.isSaving.set(false);
    this.toastService.show('Nota salva', 'success');
    return {};
  }

  
  async deleteNote(id: string): Promise<{ error?: string }> {
    const { error } = await this.noteService.deleteNote(id);

    if (error) {
      this.toastService.show('Erro ao excluir nota. Tente novamente.', 'error');
      return { error };
    }

    this.notes.update((current) => current.filter((n) => n.id !== id));

    if (this.selectedNoteId() === id) {
      this.selectedNoteId.set(null);
      this.clearDraft();
    }

    this.toastService.show('Nota excluída', 'info');
    return {};
  }

  
  async reorderNotes(noteIds: string[]): Promise<void> {
    const items = noteIds.map((id, i) => ({ id, sort_order: i }));

    const { error } = await this.noteService.batchReorderNotes(items);
    if (error) {
      this.toastService.show('Erro ao reordenar notas', 'error');
      return;
    }

    this.notes.update((current) =>
      current.map((n) => {
        const idx = noteIds.indexOf(n.id);
        if (idx !== -1) {
          return { ...n, sortOrder: idx };
        }
        return n;
      })
    );
  }

  
  async moveNote(
    noteId: string,
    targetFolderId: string
  ): Promise<{ error?: string }> {
    const { error } = await this.noteService.updateNoteFolder(
      noteId,
      targetFolderId
    );

    if (error) {
      this.toastService.show('Erro ao mover nota. Tente novamente.', 'error');
      return { error };
    }

    this.notes.update((current) =>
      current.map((n) =>
        n.id === noteId ? { ...n, folderId: targetFolderId } : n
      )
    );

    this.toastService.show('Nota movida com sucesso', 'success');
    return {};
  }

  
  async reloadNote(id: string): Promise<void> {
    const { data, error } = await this.noteService.fetchNoteById(id);
    if (error || !data) return;

    this.notes.update((current) =>
      current.map((n) =>
        n.id === id
          ? {
              id: data.id,
              folderId: data.folder_id,
              title: data.title,
              content: data.content,
              languageTags: data.language_tags ?? [],
              sortOrder: data.sort_order,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
            }
          : n
      )
    );
  }

  
  #inheritTagsFromFolder(folderId: string, userTags: string[]): string[] {
    const folder = this.folderStore.folders().find((f) => f.id === folderId);
    if (!folder) return userTags;

    const folderTag = folder.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();

    if (!folderTag) return userTags;

    const hasTag = userTags.some(
      (t) => t.toLowerCase().replace(/^#/, '') === folderTag
    );
    if (hasTag) return userTags;

    return [...userTags, folderTag];
  }
}
