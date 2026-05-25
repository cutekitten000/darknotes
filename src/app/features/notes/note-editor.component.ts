import { Component, inject, signal, computed, DestroyRef, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MarkdownComponent } from 'ngx-markdown';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { parse as markedParse } from 'marked';

import { NoteStore } from '../../core/notes/note.store';
import { ToastService } from '../../core/toast/toast.service';

@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [MarkdownComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './note-editor.component.html',
})
export class NoteEditorComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly store = inject(NoteStore);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  
  readonly showingPreview = signal(true);

  
  readonly saveStatus = computed(() => {
    if (this.store.isSaving()) return 'Salvando...';
    if (this.store.isDirty()) return 'Não salvo';
    if (this.store.draft().lastSavedAt) return 'Salvo';
    return '';
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.#loadNote(id);
      }
    });
  }

  
  #loadNote(id: string): void {
    if (this.store.isDirty() && this.store.selectedNoteId() && this.store.selectedNoteId() !== id) {
      this.store.saveDraft();
    }

    this.store.selectNote(id);
    const note = this.store.selectedNote();
    if (note) {
      this.store.initDraft(note);
    } else {
      this.store.loadNotes().then(() => {
        const loaded = this.store.selectedNote();
        if (loaded) {
          this.store.initDraft(loaded);
        } else {
          this.toastService.show('Nota não encontrada', 'error');
          this.router.navigate(['/app']);
        }
      });
    }
  }

  
  togglePreview(): void {
    this.showingPreview.update((v) => !v);
  }

  
  async onSave(): Promise<void> {
    await this.store.saveDraft();
  }

  
  @HostListener('window:keydown.control.s', ['$event'])
  onCtrlS(event: Event): void {
    event.preventDefault();
    this.onSave();
  }

  
  onEditorKeydown(event: KeyboardEvent): void {
    const isCtrl = event.ctrlKey || event.metaKey;
    const ta = event.target as HTMLTextAreaElement;

    if (event.key === 'Tab') {
      event.preventDefault();
      const content = this.store.draft().content;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      if (event.shiftKey) {
        this.#handleShiftTab(content, ta, start, end);
      } else {
        this.#handleTab(content, ta, start, end);
      }
      return;
    }

    if (isCtrl && event.key === ']') {
      event.preventDefault();
      const content = this.store.draft().content;
      this.#handleTab(content, ta, ta.selectionStart, ta.selectionEnd);
      return;
    }

    if (isCtrl && event.key === '[') {
      event.preventDefault();
      const content = this.store.draft().content;
      this.#handleShiftTab(content, ta, ta.selectionStart, ta.selectionEnd);
      return;
    }
  }

  
  #handleTab(
    content: string,
    textarea: HTMLTextAreaElement,
    start: number,
    end: number
  ): void {
    if (start !== end) {
      const lineStart = content.lastIndexOf('\n', start - 1) + 1;
      let lineEnd = content.indexOf('\n', end);
      if (lineEnd === -1) lineEnd = content.length;

      const before = content.substring(0, lineStart);
      const selectedBlock = content.substring(lineStart, lineEnd);
      const after = content.substring(lineEnd);

      const indented = selectedBlock.replace(/^/gm, '  ');
      const newContent = before + indented + after;
      this.store.updateDraftContent(newContent);

      setTimeout(() => {
        const addedLines = indented.split('\n').length;
        textarea.selectionStart = start + 2;
        textarea.selectionEnd = end + 2 * addedLines;
      });
    } else {
      const newContent =
        content.substring(0, start) + '  ' + content.substring(end);
      this.store.updateDraftContent(newContent);
      setTimeout(() => {
        textarea.selectionStart = start + 2;
        textarea.selectionEnd = start + 2;
      });
    }
  }

  
  #handleShiftTab(
    content: string,
    textarea: HTMLTextAreaElement,
    start: number,
    end: number
  ): void {
    if (start !== end) {
      const lineStart = content.lastIndexOf('\n', start - 1) + 1;
      let lineEnd = content.indexOf('\n', end);
      if (lineEnd === -1) lineEnd = content.length;

      const before = content.substring(0, lineStart);
      const selectedBlock = content.substring(lineStart, lineEnd);
      const after = content.substring(lineEnd);

      const originalLines = selectedBlock.split('\n');
      const dedentedLines = originalLines.map((l) => l.replace(/^ {1,2}/, ''));
      const dedented = dedentedLines.join('\n');
      const newContent = before + dedented + after;
      this.store.updateDraftContent(newContent);

      setTimeout(() => {
        let cursorShift = 0;
        const cursorRel = start - lineStart;
        let accumulated = 0;
        for (let i = 0; i < originalLines.length; i++) {
          const lineLen = originalLines[i].length + (i + 1 < originalLines.length ? 1 : 0);
          if (accumulated + lineLen > cursorRel) {
            cursorShift = originalLines[i].length - dedentedLines[i].length;
            break;
          }
          accumulated += lineLen;
        }

        let endShift = 0;
        const endRel = end - lineStart;
        accumulated = 0;
        for (let i = 0; i < originalLines.length; i++) {
          const lineLen = originalLines[i].length + (i + 1 < originalLines.length ? 1 : 0);
          if (accumulated + lineLen > endRel) {
            endShift = originalLines[i].length - dedentedLines[i].length;
            break;
          }
          accumulated += lineLen;
        }

        textarea.selectionStart = Math.max(lineStart, start - cursorShift);
        textarea.selectionEnd = Math.max(lineStart, end - endShift);
      });
    } else {
      const lineStart = content.lastIndexOf('\n', start - 1) + 1;
      let lineEnd = content.indexOf('\n', start);
      if (lineEnd === -1) lineEnd = content.length;

      const before = content.substring(0, lineStart);
      const line = content.substring(lineStart, lineEnd);
      const after = content.substring(lineEnd);

      const match = line.match(/^( {1,2})(.*)$/);
      if (!match) {
        setTimeout(() => {
          textarea.selectionStart = start;
          textarea.selectionEnd = start;
        });
        return;
      }

      const removedCount = match[1].length;
      const newContent = before + match[2] + after;
      this.store.updateDraftContent(newContent);

      setTimeout(() => {
        const newPos = Math.max(lineStart, start - removedCount);
        textarea.selectionStart = newPos;
        textarea.selectionEnd = newPos;
      });
    }
  }

  
  async onPaste(event: Event): Promise<void> {
    const textarea = event.target as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const content = this.store.draft().content;

    let pastedText = '';

    const clipboardEvent = event as ClipboardEvent;
    if (clipboardEvent.clipboardData) {
      pastedText = clipboardEvent.clipboardData.getData('text/plain');
    }

    if (!pastedText) {
      try {
        pastedText = await navigator.clipboard.readText();
      } catch {
        return;
      }
    }

    if (!pastedText) return;

    if (!pastedText.includes('\n')) return;

    event.preventDefault();

    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const currentLinePrefix = content.substring(lineStart, start);
    const indentMatch = currentLinePrefix.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1] : '';

    const lines = pastedText.split('\n');
    const indentedLines = lines.map((line, i) => {
      if (i === 0) return line;
      return indent + line;
    });
    const indentedText = indentedLines.join('\n');

    const newContent =
      content.substring(0, start) + indentedText + content.substring(end);
    this.store.updateDraftContent(newContent);

    setTimeout(() => {
      const newCursor = start + indentedText.length;
      textarea.selectionStart = newCursor;
      textarea.selectionEnd = newCursor;
    });
  }

  
  exportNote(): void {
    const draft = this.store.draft();
    if (!draft.title && !draft.content) {
      this.toastService.show('Nota vazia — nada para exportar', 'info');
      return;
    }
    const content = `# ${draft.title}\n\n${draft.content}`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const filename = this.#sanitizeFilename(draft.title) || 'nota';
    a.href = url;
    a.download = `${filename}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  
  #sanitizeFilename(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .toLowerCase();
  }

  
  #escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  
  async goBack(): Promise<void> {
    if (this.store.isDirty()) {
      const userChoice = window.confirm(
        'Você tem alterações não salvas. Deseja salvar antes de sair?'
      );
      if (userChoice) {
        await this.store.saveDraft();
      }
      this.store.clearDraft();
      this.store.selectNote(null);
      this.router.navigate(['/app']);
      return;
    }
    this.store.clearDraft();
    this.store.selectNote(null);
    this.router.navigate(['/app']);
  }
}
