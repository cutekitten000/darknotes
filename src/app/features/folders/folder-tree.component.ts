import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideFolder } from '@lucide/angular';
import { FolderStore } from '../../core/folders/folder.store';
import { FolderTreeNodeComponent } from './folder-tree-node.component';
import { EmptyFolderStateComponent } from './empty-folder-state.component';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';

@Component({
  selector: 'app-folder-tree',
  standalone: true,
  imports: [
    FormsModule,
    LucideFolder,
    FolderTreeNodeComponent,
    EmptyFolderStateComponent,
    ConfirmDeleteDialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './folder-tree.component.html',
})
export class FolderTreeComponent {
  readonly store = inject(FolderStore);
  private router = inject(Router);

  
  readonly deleteFolderId = signal<string | null>(null);
  readonly deleteFolderName = signal<string>('');
  readonly showDeleteDialog = signal(false);

  
  readonly isCreatingRoot = signal(false);
  readonly newRootName = signal('');

  constructor() {
    this.store.loadFolders();
  }

  
  onCreateRoot(): void {
    this.isCreatingRoot.set(true);
    this.newRootName.set('');
  }

  
  async confirmCreateRoot(): Promise<void> {
    const name = this.newRootName().trim();
    if (!name) {
      this.isCreatingRoot.set(false);
      return;
    }
    await this.store.createFolder(name, null);
    this.isCreatingRoot.set(false);
    this.newRootName.set('');
  }

  
  cancelCreateRoot(): void {
    this.isCreatingRoot.set(false);
    this.newRootName.set('');
  }

  
  onSelectFolder(id: string | null): void {
    this.store.selectFolder(id);
    this.router.navigate(['/app']);
  }

  
  onCreateSubfolder(parentId: string): void {
  }

  
  onRenameFolder(id: string, name: string): void {
    this.store.renameFolder(id, name);
  }

  
  onDeleteRequest(folderId: string, folderName: string): void {
    this.deleteFolderId.set(folderId);
    this.deleteFolderName.set(folderName);
    this.showDeleteDialog.set(true);
  }

  
  async onDeleteConfirm(folderId: string): Promise<void> {
    await this.store.deleteFolder(folderId, this.deleteFolderName());
    this.showDeleteDialog.set(false);
    this.deleteFolderId.set(null);
    this.deleteFolderName.set('');
  }

  
  onDeleteCancel(): void {
    this.showDeleteDialog.set(false);
    this.deleteFolderId.set(null);
    this.deleteFolderName.set('');
  }
}
