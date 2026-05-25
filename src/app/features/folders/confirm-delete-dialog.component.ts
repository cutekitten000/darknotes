import {
  Component,
  input,
  output,
  signal,
  inject,
  ViewChild,
  ElementRef,
  HostListener,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FolderService } from '../../core/folders/folder.service';

@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-delete-dialog.component.html',
})
export class ConfirmDeleteDialogComponent {
  private folderService = inject(FolderService);
  @ViewChild('confirmBtn') confirmBtn!: ElementRef<HTMLButtonElement>;

  readonly folderId = input.required<string>();
  readonly folderName = input.required<string>();
  readonly isVisible = input(false);
  readonly isDeleting = signal(false);
  readonly subfolderCount = signal(0);
  readonly noteCount = signal(0);
  readonly itemType = input<'pasta' | 'nota'>('pasta');

  readonly confirm = output<string>(); 
  readonly cancel = output<void>();

  constructor() {
    effect(() => {
      if (this.isVisible()) {
        this.loadCounts();
        setTimeout(() => this.confirmBtn?.nativeElement.focus());
      }
    });
  }

  
  async loadCounts(): Promise<void> {
    if (!this.isVisible() || this.itemType() !== 'pasta') return;
    const [subfolders, notes] = await Promise.all([
      this.folderService.getSubfolderCount(this.folderId()),
      this.folderService.getNoteCount(this.folderId()),
    ]);
    this.subfolderCount.set(subfolders);
    this.noteCount.set(notes);
  }

  onConfirm(): void {
    this.isDeleting.set(true);
    this.confirm.emit(this.folderId());
  }

  onCancel(): void {
    this.cancel.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isVisible()) this.onCancel();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.onCancel();
    }
  }
}
