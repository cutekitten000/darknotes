import { Component, input, output, signal, computed, inject, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  LucideChevronRight,
  LucideFolderOpen,
  LucideFolder,
  LucideFilePlus,
  LucidePlus,
  LucidePencil,
  LucideTrash2,
} from '@lucide/angular';
import { FolderStore } from '../../core/folders/folder.store';
import { NoteStore } from '../../core/notes/note.store';
import { FolderNode } from '../../core/folders/folder.types';
import { CreateNoteDialogComponent } from '../notes/create-note-dialog.component';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';
import { ContextMenuComponent, ContextMenuItem } from '../../shared/context-menu/context-menu.component';
import { MoveNoteDialogComponent } from '../notes/move-note-dialog.component';

@Component({
  selector: 'app-folder-tree-node',
  standalone: true,
  imports: [
    FormsModule,
    LucideChevronRight,
    LucideFolderOpen,
    LucideFolder,
    LucideFilePlus,
    LucidePlus,
    LucidePencil,
    LucideTrash2,
    CreateNoteDialogComponent,
    ConfirmDeleteDialogComponent,
    ContextMenuComponent,
    MoveNoteDialogComponent,
    FolderTreeNodeComponent, 
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './folder-tree-node.component.html',
})
export class FolderTreeNodeComponent {
  readonly store = inject(FolderStore);
  readonly noteStore = inject(NoteStore);
  private router = inject(Router);

  readonly folder = input.required<FolderNode>();
  readonly depth = input(0);
  readonly selectedFolderId = input<string | null>(null);

  readonly selectFolder = output<string | null>();
  readonly createSubfolder = output<string>();
  readonly renameFolder = output<{ id: string; name: string }>();
  readonly deleteFolder = output<{ id: string; name: string }>();

  readonly isHovered = signal(false);
  readonly isRenaming = signal(false);
  readonly renameValue = signal('');
  readonly showCreateNoteDialog = signal(false);
  readonly isCreatingSubfolder = signal(false);
  readonly newSubfolderName = signal('');

  readonly dropZone = signal<'above' | 'below' | 'inside' | null>(null);
  readonly isDragging = signal(false);
  readonly noteDropZone = signal<{ noteId: string; position: 'above' | 'below' } | null>(null);
  readonly noteDraggingId = signal<string | null>(null);

  @ViewChild('folderContextMenu') fileContextMenu!: ContextMenuComponent;

  readonly noteContextMenuTarget = signal<string | null>(null);
  readonly showNoteDeleteConfirm = signal<string | null>(null);
  readonly showMoveNoteDialog = signal(false);

  #autoExpandTimer: ReturnType<typeof setTimeout> | null = null;

  readonly noteCount = computed(() => {
    return this.noteStore.noteCountByFolder().get(this.folder().id) ?? 0;
  });

  readonly folderNotes = computed(() => {
    return this.noteStore
      .notes()
      .filter((n) => n.folderId === this.folder().id);
  });

  readonly children = computed(() => {
    return this.store.childrenOf(this.folder().id);
  });

  readonly isExpanded = computed(() => {
    return this.store.isExpanded(this.folder().id);
  });

  readonly hasChildren = computed(() => {
    return this.children().length > 0 || this.folderNotes().length > 0;
  });

  readonly isSelected = computed(() => {
    return this.selectedFolderId() === this.folder().id;
  });

  readonly contextMenuItems = computed<ContextMenuItem[]>(() => {
    const noteId = this.noteContextMenuTarget();
    if (noteId) {
      return [
        {
          id: 'open',
          label: 'Abrir',
          action: () => this.router.navigate(['/app', 'editor', noteId]),
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
          action: () => this.showNoteDeleteConfirm.set(noteId),
        },
      ];
    }
    return [
      {
        id: 'create-note',
        label: 'Criar nota',
        action: () => this.startCreateNote(),
      },
      {
        id: 'create-subfolder',
        label: 'Criar subpasta',
        action: () => this.startCreateSubfolder(),
      },
      { id: 'separator', label: '', action: () => {} },
      {
        id: 'rename',
        label: 'Renomear',
        action: () => this.startRename(),
      },
      {
        id: 'delete',
        label: 'Excluir',
        danger: true,
        action: () => this.onDelete(),
      },
    ];
  });


  startCreateNote(): void {
    this.store.expandToFolder(this.folder().id);
    this.showCreateNoteDialog.set(true);
  }

  onCloseCreateDialog(): void {
    this.showCreateNoteDialog.set(false);
  }


  startCreateSubfolder(): void {
    this.store.expandToFolder(this.folder().id);
    this.isCreatingSubfolder.set(true);
    this.newSubfolderName.set('');
  }

  async confirmCreateSubfolder(): Promise<void> {
    const name = this.newSubfolderName().trim();
    if (!name) {
      this.isCreatingSubfolder.set(false);
      return;
    }
    await this.store.createFolder(name, this.folder().id);
    this.isCreatingSubfolder.set(false);
    this.newSubfolderName.set('');
  }

  cancelCreateSubfolder(): void {
    this.isCreatingSubfolder.set(false);
    this.newSubfolderName.set('');
  }


  onSelect(): void {
    this.toggleExpand();
    this.selectFolder.emit(this.folder().id);

    this.router.navigate(['/app']);
  }

  toggleExpand(): void {
    this.store.toggleExpand(this.folder().id);
  }


  startRename(): void {
    this.isRenaming.set(true);
    this.renameValue.set(this.folder().name);
  }

  confirmRename(): void {
    const trimmed = this.renameValue().trim();
    if (!trimmed || trimmed === this.folder().name) {
      this.isRenaming.set(false);
      return;
    }
    this.renameFolder.emit({ id: this.folder().id, name: trimmed });
    this.isRenaming.set(false);
  }

  cancelRename(): void {
    this.isRenaming.set(false);
  }


  onDelete(): void {
    this.deleteFolder.emit({ id: this.folder().id, name: this.folder().name });
  }


  openNote(noteId: string): void {
    this.router.navigate(['/app', 'editor', noteId]);
  }

  onNoteKeyEnter(event: Event, noteId: string): void {
    const ke = event as KeyboardEvent;
    if (ke.key === 'Enter') {
      this.openNote(noteId);
    }
  }

  onKeyEnter(event: Event): void {
    const ke = event as KeyboardEvent;
    if (ke.key === 'Enter') {
      this.onSelect();
    }
  }

  onKeyArrowToggle(event: Event): void {
    const ke = event as KeyboardEvent;
    if (ke.key === 'ArrowRight' || ke.key === 'ArrowLeft') {
      ke.preventDefault();
      this.toggleExpand();
    }
  }


  async onNoteDeleteResult(noteId: string, deleted: boolean): Promise<void> {
    this.showNoteDeleteConfirm.set(null);
    if (deleted) {
      await this.noteStore.deleteNote(noteId);
    }
  }


  async onMoveNoteResult(targetFolderId: string | null): Promise<void> {
    this.showMoveNoteDialog.set(false);
    const noteId = this.noteContextMenuTarget();
    if (targetFolderId && noteId) {
      await this.noteStore.moveNote(noteId, targetFolderId);
      this.noteContextMenuTarget.set(null);
    }
  }


  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    this.noteContextMenuTarget.set(null);
    this.fileContextMenu.open(event.clientX, event.clientY);
  }

  onNoteContextMenu(event: MouseEvent, noteId: string): void {
    event.preventDefault();
    this.noteContextMenuTarget.set(noteId);
    this.fileContextMenu.open(event.clientX, event.clientY);
  }


  
  onFolderDragStart(event: DragEvent): void {
    this.isDragging.set(true);
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData(
      'application/darknotes-item',
      JSON.stringify({ type: 'folder', id: this.folder().id })
    );
  }

  
  onNoteDragStart(event: DragEvent, noteId: string): void {
    this.noteDraggingId.set(noteId);
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData(
      'application/darknotes-item',
      JSON.stringify({ type: 'note', id: noteId })
    );
  }

  
  onDragEnd(): void {
    this.isDragging.set(false);
    this.noteDraggingId.set(null);
    this.dropZone.set(null);
    this.noteDropZone.set(null);
    this.#cancelAutoExpand();
  }

  
  onFolderDragOver(event: DragEvent): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    this.dropZone.set(this.#computeDropPosition(event, 'folder'));
    this.#handleAutoExpand();
  }

  
  onFolderDragLeave(): void {
    this.dropZone.set(null);
    this.#cancelAutoExpand();
  }

  
  onFolderDrop(event: DragEvent): void {
    event.preventDefault();
    const zone = this.dropZone();
    this.dropZone.set(null);
    this.#cancelAutoExpand();
    if (zone) this.#executeDrop(event, this.folder().id, 'folder', zone);
  }

  
  onNoteDragOver(event: DragEvent, noteId: string): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    const pos = this.#computeVerticalPosition(event);
    this.noteDropZone.set({ noteId, position: pos });
  }

  
  onNoteDragLeave(noteId: string): void {
    const current = this.noteDropZone();
    if (current?.noteId === noteId) {
      this.noteDropZone.set(null);
    }
  }

  
  onNoteDrop(event: DragEvent, noteId: string): void {
    event.preventDefault();
    const zone = this.noteDropZone();
    this.noteDropZone.set(null);
    if (zone) {
      this.#executeDrop(event, noteId, 'note', zone.position);
    }
  }

  
  #computeDropPosition(
    event: DragEvent,
    targetType: 'folder' | 'note'
  ): 'above' | 'below' | 'inside' {
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const height = rect.height;

    if (y < height * 0.3) return 'above';
    if (y > height * 0.7) return 'below';
    return targetType === 'folder' ? 'inside' : 'above';
  }

  
  #computeVerticalPosition(event: DragEvent): 'above' | 'below' {
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const y = event.clientY - rect.top;
    return y < rect.height / 2 ? 'above' : 'below';
  }

  
  async #executeDrop(
    event: DragEvent,
    targetId: string,
    targetType: 'folder' | 'note',
    position: 'above' | 'below' | 'inside'
  ): Promise<void> {
    const raw = event.dataTransfer?.getData('application/darknotes-item');
    if (!raw) return;

    const dragged = JSON.parse(raw) as { type: 'folder' | 'note'; id: string };

    if (dragged.type === 'folder' && dragged.id === targetId) return;
    if (dragged.type === 'note' && dragged.id === targetId) return;

    if (dragged.type === 'folder') {
      await this.#moveDraggedFolder(dragged.id, targetId, targetType, position);
    } else if (dragged.type === 'note') {
      await this.#moveDraggedNote(dragged.id, targetId, targetType, position);
    }
  }

  
  async #moveDraggedFolder(
    folderId: string,
    targetId: string,
    targetType: 'folder' | 'note',
    position: 'above' | 'below' | 'inside'
  ): Promise<void> {
    let newParentId: string | null = null;

    if (targetType === 'folder' && position === 'inside') {
      newParentId = targetId;
    } else {
      const target = this.store.folders().find((f) => f.id === targetId);
      if (target) {
        newParentId = target.parentId;
      }
    }

    if (newParentId === undefined) return;

    if (newParentId !== this.store.folders().find((f) => f.id === folderId)?.parentId) {
      await this.store.moveFolder(folderId, newParentId);
    }

    const folderPosition = (position === 'inside') ? 'below' : position;
    await this.#reorderFolderSiblings(folderId, targetId, folderPosition, newParentId);
  }

  
  async #reorderFolderSiblings(
    draggedId: string,
    targetId: string,
    position: 'above' | 'below',
    parentId: string | null
  ): Promise<void> {
    const siblings = this.store
      .folders()
      .filter((f) => f.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const draggedIdx = siblings.findIndex((f) => f.id === draggedId);
    const dragged = draggedIdx !== -1 ? siblings.splice(draggedIdx, 1)[0] : null;
    if (!dragged) return;

    const targetIdx = siblings.findIndex((f) => f.id === targetId);
    if (targetIdx === -1) {
      siblings.push(dragged);
    } else if (position === 'above') {
      siblings.splice(targetIdx, 0, dragged);
    } else {
      siblings.splice(targetIdx + 1, 0, dragged);
    }

    await this.store.reorderFolders(siblings.map((f) => f.id));
  }

  
  async #moveDraggedNote(
    noteId: string,
    targetId: string,
    targetType: 'folder' | 'note',
    position: 'above' | 'below' | 'inside'
  ): Promise<void> {
    let targetFolderId: string | null = null;

    if (targetType === 'folder') {
      targetFolderId = targetId;
    } else {
      const targetNote = this.noteStore.notes().find((n) => n.id === targetId);
      if (targetNote) {
        targetFolderId = targetNote.folderId;
      }
    }

    if (!targetFolderId) return;

    const currentNote = this.noteStore.notes().find((n) => n.id === noteId);
    if (!currentNote) return;

    if (currentNote.folderId !== targetFolderId) {
      await this.noteStore.moveNote(noteId, targetFolderId);
    }

    const notePosition = (position === 'inside') ? 'below' : position;
    await this.#reorderNoteSiblings(noteId, targetId, targetType, notePosition, targetFolderId);
  }

  
  async #reorderNoteSiblings(
    draggedId: string,
    targetId: string,
    targetType: 'folder' | 'note',
    position: 'above' | 'below',
    folderId: string
  ): Promise<void> {
    const siblings = this.noteStore
      .notes()
      .filter((n) => n.folderId === folderId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const draggedIdx = siblings.findIndex((n) => n.id === draggedId);
    const dragged = draggedIdx !== -1 ? siblings.splice(draggedIdx, 1)[0] : null;
    if (!dragged) return;

    if (targetType === 'folder') {
      siblings.push(dragged);
    } else {
      const targetIdx = siblings.findIndex((n) => n.id === targetId);
      if (targetIdx === -1) {
        siblings.push(dragged);
      } else if (position === 'above') {
        siblings.splice(targetIdx, 0, dragged);
      } else {
        siblings.splice(targetIdx + 1, 0, dragged);
      }
    }

    await this.noteStore.reorderNotes(siblings.map((n) => n.id));
  }


  #handleAutoExpand(): void {
    if (this.#autoExpandTimer) return;
    if (this.isExpanded()) return;

    this.#autoExpandTimer = setTimeout(() => {
      this.toggleExpand();
      this.#autoExpandTimer = null;
    }, 600);
  }

  #cancelAutoExpand(): void {
    if (this.#autoExpandTimer) {
      clearTimeout(this.#autoExpandTimer);
      this.#autoExpandTimer = null;
    }
  }
}
