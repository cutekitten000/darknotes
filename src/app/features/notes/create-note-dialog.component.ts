import { Component, input, output, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NoteStore } from '../../core/notes/note.store';

@Component({
  selector: 'app-create-note-dialog',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './create-note-dialog.component.html',
})
export class CreateNoteDialogComponent {
  private noteStore = inject(NoteStore);
  private router = inject(Router);

  readonly folderId = input.required<string>();
  readonly isVisible = input(false);
  readonly close = output<void>();

  readonly title = signal('');
  readonly tags = signal('');
  readonly isCreating = signal(false);

  async onCreate(): Promise<void> {
    const titleTrimmed = this.title().trim();
    if (!titleTrimmed) return;

    const parsedTags = this.tags()
      .split(/[,;\s]+/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter((t) => t.length > 0);

    this.isCreating.set(true);
    const { data, error } = await this.noteStore.createNote(
      this.folderId(),
      titleTrimmed,
      parsedTags
    );

    this.isCreating.set(false);

    if (data && !error) {
      this.close.emit();
      this.router.navigate(['/app', 'editor', data.id]);
    }
  }

  onCancel(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.onCancel();
    }
  }
}
