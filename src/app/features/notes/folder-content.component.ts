import { Component, signal, computed, inject, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FolderStore } from '../../core/folders/folder.store';
import { NoteStore } from '../../core/notes/note.store';
import { ContextMenuComponent, ContextMenuItem } from '../../shared/context-menu/context-menu.component';
import { ConfirmDeleteDialogComponent } from '../folders/confirm-delete-dialog.component';
import { MoveNoteDialogComponent } from './move-note-dialog.component';

@Component({
  selector: 'app-folder-content',
  standalone: true,
  imports: [FormsModule, ContextMenuComponent, ConfirmDeleteDialogComponent, MoveNoteDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col">
      @if (selectedFolder()) {
        
        <div class="px-4 md:px-6 pt-4 md:pt-6 pb-2 border-b border-border shrink-0">
          <div class="flex items-center gap-2 mb-3 md:mb-4">
            
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"
              class="text-accent shrink-0"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <h1 class="text-lg font-semibold text-text truncate">{{ selectedFolder()?.name }}</h1>
            <span class="text-xs text-text-muted ml-auto">({{ filteredNotes().length }} arquivo{{ filteredNotes().length === 1 ? '' : 's' }})</span>
          </div>

          
          <div class="flex items-center gap-3 bg-surface-2 border border-border rounded-[6px] px-4 py-2.5 focus-within:border-accent transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18" height="18" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"
              class="text-text-muted shrink-0"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              [ngModel]="localSearch()"
              (ngModelChange)="localSearch.set($event)"
              placeholder="Buscar arquivos..."
              class="flex-1 bg-transparent text-sm md:text-base text-text placeholder:text-text-muted outline-none"
            />
            @if (localSearch()) {
              <button
                (click)="localSearch.set('')"
                class="text-text-muted hover:text-text transition-colors p-0.5"
                aria-label="Limpar busca"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16" height="16" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            }
          </div>
        </div>

        
        <div class="flex-1 overflow-y-auto">
          @if (filteredNotes().length === 0) {
            <div class="flex flex-col items-center justify-center h-full text-center px-4">
              <p class="text-sm text-text-muted/60">
                @if (localSearch()) {
                  Nenhum arquivo encontrado para "{{ localSearch() }}"
                } @else {
                  Esta pasta está vazia. Crie uma nota com o botão direito na pasta.
                }
              </p>
            </div>
          } @else {
            <div class="divide-y divide-border/50">
              @for (note of filteredNotes(); track note.id) {
                <div
                  class="flex items-center gap-3 px-4 md:px-6 py-3 min-h-12 md:min-h-10 hover:bg-surface-2 transition-colors cursor-pointer group"
                  (click)="openNote(note.id)"
                  (contextmenu)="onNoteContextMenu($event, note.id)"
                >
                  
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round"
                    class="text-text-muted shrink-0"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>

                  
                  <span class="flex-1 min-w-0 truncate text-sm text-text group-hover:text-accent transition-colors">
                    {{ note.title }}
                  </span>

                  
                  @if (note.languageTags.length > 0) {
                    <div class="flex items-center gap-1">
                      @for (tag of note.languageTags.slice(0, 2); track tag) {
                        <span class="text-[10px] px-1.5 py-0.5 rounded-[2px] bg-surface-3 text-text-muted font-mono">
                          #{{ tag }}
                        </span>
                      }
                      @if (note.languageTags.length > 2) {
                        <span class="text-[10px] text-text-muted">+{{ note.languageTags.length - 2 }}</span>
                      }
                    </div>
                  }

                  
                  <span class="text-[11px] text-text-muted shrink-0">
                    {{ formatDate(note.updatedAt) }}
                  </span>
                </div>
              }
            </div>
          }
        </div>
      } @else {
        
        <div class="flex flex-col items-center justify-center h-full text-center px-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48" height="48" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round"
            class="text-text-muted mb-4 opacity-40"
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          <h2 class="text-base font-medium text-text-muted mb-1">Selecione uma pasta</h2>
          <p class="text-sm text-text-muted/60 max-w-[240px]">
            Clique em uma pasta na barra lateral para ver seus arquivos.
          </p>
        </div>
      }

      
      <app-context-menu
        #contentContextMenu
        [items]="contextMenuItems()"
      />

      
      <app-move-note-dialog
        [isVisible]="showMoveNoteDialog()"
        (close)="onMoveNoteResult($event)"
      />

      
      @if (showDeleteConfirm()) {
        <app-confirm-delete-dialog
          [folderId]="''"
          [folderName]="noteToDeleteTitle()"
          [isVisible]="true"
          [itemType]="'nota'"
          (confirm)="onDeleteResult(true)"
          (cancel)="onDeleteResult(false)"
        />
      }
    </div>
  `,
})
export class FolderContentComponent {
  @ViewChild('contentContextMenu') contextMenu!: ContextMenuComponent;

  private folderStore = inject(FolderStore);
  private noteStore = inject(NoteStore);
  private router = inject(Router);

  readonly selectedFolder = computed(() => {
    const id = this.folderStore.selectedFolderId();
    if (!id) return null;
    const all = this.folderStore.folders();
    return all.find((f) => f.id === id) ?? null;
  });

  
  readonly localSearch = signal('');

  
  readonly filteredNotes = computed(() => {
    const folderId = this.folderStore.selectedFolderId();
    if (!folderId) return [];

    const query = this.localSearch().toLowerCase().trim();
    return this.noteStore.notes().filter((n) => {
      if (n.folderId !== folderId) return false;
      if (query && !n.title.toLowerCase().includes(query)) return false;
      return true;
    });
  });

  readonly noteContextMenuTarget = signal<string | null>(null);
  readonly showDeleteConfirm = signal(false);
  readonly noteToDeleteTitle = signal('');
  readonly showMoveNoteDialog = signal(false);

  readonly contextMenuItems = computed<ContextMenuItem[]>(() => {
    const noteId = this.noteContextMenuTarget();
    if (!noteId) return [];
    return [
      {
        id: 'open',
        label: 'Abrir',
        action: () => this.openNote(noteId),
      },
      {
        id: 'export',
        label: 'Exportar .md',
        action: () => this.exportNote(noteId),
      },
      {
        id: 'move',
        label: 'Mover para...',
        action: () => this.showMoveNoteDialog.set(true),
      },
      {
        id: 'delete',
        label: 'Excluir',
        danger: true,
        action: () => {
          const note = this.noteStore.notes().find((n) => n.id === noteId);
          this.noteToDeleteTitle.set(note?.title ?? '');
          this.showDeleteConfirm.set(true);
        },
      },
    ];
  });

  onMoveNoteResult(targetFolderId: string | null): void {
    this.showMoveNoteDialog.set(false);
    const noteId = this.noteContextMenuTarget();
    if (targetFolderId && noteId) {
      this.noteStore.moveNote(noteId, targetFolderId);
      this.noteContextMenuTarget.set(null);
    }
  }

  onNoteContextMenu(event: MouseEvent, noteId: string): void {
    event.preventDefault();
    this.noteContextMenuTarget.set(noteId);
    this.contextMenu?.open(event.clientX, event.clientY);
  }

  exportNote(noteId: string): void {
    const note = this.noteStore.notes().find((n) => n.id === noteId);
    if (!note) return;
    const content = `# ${note.title}\n\n${note.content}`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const filename = note.title
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .toLowerCase() || 'nota';
    a.href = url;
    a.download = `${filename}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  openNote(noteId: string): void {
    this.router.navigate(['/app', 'editor', noteId]);
  }

  onDeleteResult(deleted: boolean): void {
    const noteId = this.noteContextMenuTarget();
    this.showDeleteConfirm.set(false);
    this.noteContextMenuTarget.set(null);
    if (deleted && noteId) {
      this.noteStore.deleteNote(noteId);
    }
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `Há ${diffDays} dias`;
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
