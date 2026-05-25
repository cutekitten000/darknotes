import { Injectable, signal, computed, inject } from '@angular/core';
import { FolderService } from './folder.service';
import { FolderNode } from './folder.types';
import { ToastService } from '../toast/toast.service';

@Injectable({ providedIn: 'root' })
export class FolderStore {
  private folderService = inject(FolderService);
  private toastService = inject(ToastService);

  
  readonly folders = signal<FolderNode[]>([]);

  
  readonly selectedFolderId = signal<string | null>(null);

  
  readonly isLoading = signal(false);

  
  readonly isCreating = signal(false);

  
  readonly expandedFolderIds = signal<Set<string>>(new Set());

  
  readonly rootFolders = computed(() => {
    const all = this.folders();
    const map = new Map<string, FolderNode>();
    const roots: FolderNode[] = [];

    for (const node of all) {
      map.set(node.id, { ...node, children: [] });
    }

    for (const [, node] of map) {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)!.children.push(node);
      } else if (!node.parentId) {
        roots.push(node);
      }
    }

    const bySortOrder = (a: FolderNode, b: FolderNode) => a.sortOrder - b.sortOrder;

    roots.sort(bySortOrder);
    for (const [, node] of map) {
      node.children.sort(bySortOrder);
    }

    return roots;
  });

  
  async loadFolders(): Promise<void> {
    this.isLoading.set(true);
    const { data, error } = await this.folderService.fetchFolders();

    if (error) {
      this.toastService.show('Erro ao carregar pastas', 'error');
      this.isLoading.set(false);
      return;
    }

    this.folders.set(
      (data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        parentId: row.parent_id,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        children: [],
      }))
    );
    this.isLoading.set(false);
  }

  
  async createFolder(
    name: string,
    parentId: string | null
  ): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) {
      this.toastService.show(
        'O nome da pasta não pode estar vazio.',
        'error'
      );
      return;
    }

    this.isCreating.set(true);
    const { data, error } = await this.folderService.createFolder(
      trimmed,
      parentId
    );

    if (error) {
      this.toastService.show(
        'Erro ao criar pasta. Tente novamente.',
        'error'
      );
      this.isCreating.set(false);
      return;
    }

    if (data) {
      const newNode: FolderNode = {
        id: data.id,
        name: data.name,
        parentId: data.parent_id,
        sortOrder: data.sort_order,
        createdAt: data.created_at,
        children: [],
      };

      this.folders.update((current) => [...current, newNode]);

      if (parentId) {
        this.expandedFolderIds.update((ids) => {
          const next = new Set(ids);
          next.add(parentId);
          return next;
        });
      }
    }

    this.isCreating.set(false);
    this.toastService.show(`Pasta "${trimmed}" criada`, 'success');
  }

  
  async renameFolder(id: string, name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) {
      this.toastService.show(
        'O nome da pasta não pode estar vazio.',
        'error'
      );
      return;
    }

    const { error } = await this.folderService.renameFolder(id, trimmed);

    if (error) {
      this.toastService.show(
        'Erro ao renomear pasta. Tente novamente.',
        'error'
      );
      return;
    }

    this.folders.update((current) =>
      current.map((f) =>
        f.id === id ? { ...f, name: trimmed } : f
      )
    );

    this.toastService.show(`Pasta renomeada para "${trimmed}"`, 'info');
  }

  
  async deleteFolder(id: string, name: string): Promise<void> {
    const { error } = await this.folderService.softDeleteFolder(id);

    if (error) {
      this.toastService.show(
        'Erro ao excluir pasta. Tente novamente.',
        'error'
      );
      return;
    }

    const idsToRemove = this.#collectDescendantIds(id);

    this.folders.update((current) =>
      current.filter((f) => !idsToRemove.has(f.id))
    );

    if (this.selectedFolderId() && idsToRemove.has(this.selectedFolderId()!)) {
      this.selectedFolderId.set(null);
    }

    this.expandedFolderIds.update((ids) => {
      const next = new Set(ids);
      for (const id of idsToRemove) {
        next.delete(id);
      }
      return next;
    });

    this.toastService.show(`Pasta "${name}" excluída`, 'info');
  }

  
  #collectDescendantIds(parentId: string): Set<string> {
    const ids = new Set<string>([parentId]);
    const all = this.folders();
    let prevSize = 0;
    while (prevSize !== ids.size) {
      prevSize = ids.size;
      for (const f of all) {
        if (f.parentId && ids.has(f.parentId)) ids.add(f.id);
      }
    }
    return ids;
  }

  
  async moveFolder(
    id: string,
    newParentId: string | null
  ): Promise<void> {
    const { error } = await this.folderService.updateFolderParent(id, newParentId);

    if (error) {
      this.toastService.show('Erro ao mover pasta. Tente novamente.', 'error');
      return;
    }

    this.folders.update((current) =>
      current.map((f) =>
        f.id === id ? { ...f, parentId: newParentId } : f
      )
    );

    if (newParentId) {
      this.expandedFolderIds.update((ids) => {
        const next = new Set(ids);
        next.add(newParentId);
        return next;
      });
    }
  }

  
  async reorderFolders(folderIds: string[]): Promise<void> {
    const items = folderIds.map((id, i) => ({ id, sort_order: i }));

    const { error } = await this.folderService.batchReorderFolders(items);
    if (error) {
      this.toastService.show('Erro ao reordenar pastas', 'error');
      return;
    }

    this.folders.update((current) =>
      current.map((f) => {
        const idx = folderIds.indexOf(f.id);
        if (idx !== -1) {
          return { ...f, sortOrder: idx };
        }
        return f;
      })
    );
  }

  
  selectFolder(id: string | null): void {
    this.selectedFolderId.set(id);
  }

  
  toggleExpand(id: string): void {
    this.expandedFolderIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  
  isExpanded(id: string): boolean {
    return this.expandedFolderIds().has(id);
  }

  
  expandToFolder(id: string): void {
    if (!this.expandedFolderIds().has(id)) {
      this.expandedFolderIds.update((ids) => {
        const next = new Set(ids);
        next.add(id);
        return next;
      });
    }
  }

  
  childrenOf(parentId: string): FolderNode[] {
    const all = this.folders();
    const children = all.filter((f) => f.parentId === parentId);
    children.sort((a, b) => a.sortOrder - b.sortOrder);
    return children;
  }
}
