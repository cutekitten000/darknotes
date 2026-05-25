import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { NoteStore } from '../../core/notes/note.store';
import { FolderStore } from '../../core/folders/folder.store';
import { NoteCardComponent } from './note-card.component';

@Component({
  selector: 'app-notes-grid',
  standalone: true,
  imports: [NoteCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notes-grid.component.html',
})
export class NotesGridComponent {
  readonly noteStore = inject(NoteStore);
  readonly folderStore = inject(FolderStore);

  constructor() {
    if (this.noteStore.notes().length === 0 && !this.noteStore.isLoading()) {
      this.noteStore.loadNotes();
    }
  }
}
