import { Component, input, output, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { FolderStore } from '../../core/folders/folder.store';

@Component({
  selector: 'app-move-note-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isVisible()) {
      <div
        class="dialog-backdrop fixed inset-0 z-40 flex items-center justify-center bg-overlay-bg"
        (click)="onBackdropClick($event)"
      >
        <div
          class="bg-surface-2 rounded-[4px] w-full max-w-[400px] p-6 mx-4"
          (click)="$event.stopPropagation()"
          role="dialog"
          aria-modal="true"
          aria-labelledby="move-dialog-title"
        >
          <h2 id="move-dialog-title" class="text-base font-semibold text-text mb-4">
            Mover nota para...
          </h2>

          <p class="text-sm text-text-muted mb-4">
            Selecione a pasta de destino:
          </p>

          <div class="max-h-[300px] overflow-y-auto space-y-0.5 mb-6 border border-border rounded-[4px] bg-surface-3">
            @for (folder of flatFolders(); track folder.id) {
              <button
                (click)="selectedFolderId.set(folder.id)"
                class="w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2"
                [class.bg-surface-hover]="selectedFolderId() === folder.id"
                [class.text-accent]="selectedFolderId() === folder.id"
                [class.text-text]="selectedFolderId() !== folder.id"
                [class.hover:bg-surface-hover]="selectedFolderId() !== folder.id"
                [style.paddingLeft.px]="16 + folder.depth * 16"
              >
                
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round"
                  class="shrink-0"
                  [class.text-accent]="selectedFolderId() === folder.id"
                  [class.text-text-muted]="selectedFolderId() !== folder.id"
                >
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>

                <span class="truncate">{{ folder.name }}</span>
              </button>
            }

            @if (flatFolders().length === 0) {
              <div class="px-3 py-4 text-center text-sm text-text-muted">
                Nenhuma pasta disponível.
              </div>
            }
          </div>

          <div class="flex justify-end gap-3">
            <button
              (click)="onCancel()"
              class="px-4 py-2 text-sm font-semibold text-text-muted hover:text-text rounded-[4px] hover:bg-surface-3 transition-colors"
            >
              Cancelar
            </button>
            <button
              (click)="onConfirm()"
              [disabled]="!selectedFolderId()"
              class="px-4 py-2 text-sm font-semibold text-white bg-accent hover:bg-accent-light rounded-[4px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mover
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class MoveNoteDialogComponent {
  private folderStore = inject(FolderStore);

  readonly isVisible = input(false);
  readonly close = output<string | null>(); 

  readonly selectedFolderId = signal<string | null>(null);

  
  readonly flatFolders = computed(() => {
    const result: { id: string; name: string; depth: number }[] = [];
    const all = this.folderStore.folders();

    const map = new Map<string, { id: string; name: string; parentId: string | null }[]>();
    for (const f of all) {
      const children = map.get(f.parentId ?? '__root__') ?? [];
      children.push({ id: f.id, name: f.name, parentId: f.parentId });
      map.set(f.parentId ?? '__root__', children);
    }

    const walk = (parentId: string | null, depth: number) => {
      const children = map.get(parentId ?? '__root__') ?? [];
      for (const child of children) {
        result.push({ id: child.id, name: child.name, depth });
        walk(child.id, depth + 1);
      }
    };

    walk(null, 0);
    return result;
  });

  onConfirm(): void {
    const id = this.selectedFolderId();
    if (id) {
      this.close.emit(id);
    }
  }

  onCancel(): void {
    this.close.emit(null);
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.onCancel();
    }
  }
}
