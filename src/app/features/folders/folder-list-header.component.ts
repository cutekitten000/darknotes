import { Component, output, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { LucidePlus, LucideFilePlus } from '@lucide/angular';
import { FolderStore } from '../../core/folders/folder.store';
import { CreateNoteDialogComponent } from '../notes/create-note-dialog.component';

@Component({
  selector: 'app-folder-list-header',
  standalone: true,
  imports: [LucidePlus, LucideFilePlus, CreateNoteDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './folder-list-header.component.html',
})
export class FolderListHeaderComponent {
  private folderStore = inject(FolderStore);

  readonly showCreateNoteDialog = signal(false);
  readonly createNoteFolderId = signal('');
  readonly createRoot = output<void>();

  readonly rootFolders = this.folderStore.rootFolders;

  onCreateRoot(): void {
    this.createRoot.emit();
  }

  onCreateRootNote(): void {
    const targetFolderId = this.folderStore.selectedFolderId() ??
      this.rootFolders()[0]?.id;

    if (!targetFolderId) {
      return;
    }

    this.createNoteFolderId.set(targetFolderId);
    this.showCreateNoteDialog.set(true);
  }

  onCloseCreateDialog(): void {
    this.showCreateNoteDialog.set(false);
  }
}
