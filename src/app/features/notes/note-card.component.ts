import { Component, input, inject, signal, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { NoteNode } from '../../core/notes/note.types';
import { NoteStore } from '../../core/notes/note.store';
import { ConfirmDeleteDialogComponent } from '../folders/confirm-delete-dialog.component';
import { ContextMenuComponent, ContextMenuItem } from '../../shared/context-menu/context-menu.component';

@Component({
  selector: 'app-note-card',
  standalone: true,
  imports: [ConfirmDeleteDialogComponent, ContextMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './note-card.component.html',
})
export class NoteCardComponent {
  readonly note = input.required<NoteNode>();
  private router = inject(Router);
  private noteStore = inject(NoteStore);
  readonly showDeleteConfirm = signal(false);
  @ViewChild('contextMenu') contextMenu!: ContextMenuComponent;

  
  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    this.contextMenu?.open(event.clientX, event.clientY);
  }

  readonly menuItems: ContextMenuItem[] = [
    {
      id: 'open',
      label: 'Abrir',
      action: () => this.openEditor(),
    },
    {
      id: 'delete',
      label: 'Excluir',
      danger: true,
      action: () => this.showDeleteConfirm.set(true),
    },
  ];

  
  getPreview(content: string): string {
    if (!content) return 'Sem conteúdo';
    const lines = content.split('\n').filter((line) => line.trim().length > 0);
    const firstContentLine = lines.find((line) => !line.startsWith('#'));
    if (firstContentLine) {
      return firstContentLine.replace(/[*_~`>]/g, '').substring(0, 150);
    }
    return lines[0]?.replace(/[*_~`>]/g, '').substring(0, 150) ?? 'Sem conteúdo';
  }

  
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (diffDays === 1) {
      return 'Ontem';
    }
    if (diffDays < 7) {
      return `Há ${diffDays} dias`;
    }
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  
  formatTags(tags: string[]): string[] {
    if (!tags || tags.length === 0) return [];
    return tags.map((tag) => (tag.startsWith('#') ? tag : `#${tag}`));
  }

  
  openEditor(): void {
    this.router.navigate(['/app', 'editor', this.note().id]);
  }

  
  requestDelete(event: Event): void {
    event.stopPropagation();
    this.showDeleteConfirm.set(true);
  }

  
  async onDeleteResult(deleted: boolean): Promise<void> {
    this.showDeleteConfirm.set(false);
    if (deleted) {
      await this.noteStore.deleteNote(this.note().id);
    }
  }
}
