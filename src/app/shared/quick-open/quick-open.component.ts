import {
  Component,
  input,
  output,
  signal,
  computed,
  inject,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  afterNextRender,
} from '@angular/core';
import { Router } from '@angular/router';
import { NoteStore } from '../../core/notes/note.store';
import { FolderStore } from '../../core/folders/folder.store';
import { NoteNode } from '../../core/notes/note.types';

@Component({
  selector: 'app-quick-open',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isVisible()) {
      
      <div
        class="fixed inset-0 z-50 bg-black/40"
        (click)="doClose()"
        (keydown.escape)="doClose()"
      ></div>

      
      <div
        class="fixed z-50 top-[15vh] left-1/2 -translate-x-1/2
               w-[90vw] max-w-[520px] max-h-[60vh]
               bg-surface-2 border border-border rounded-lg shadow-2xl
               flex flex-col overflow-hidden"
        role="dialog"
        aria-label="Pesquisa rápida"
      >
        
        <div class="flex items-center gap-2 px-4 py-3 border-b border-border">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
               class="text-text-muted shrink-0">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            #searchInput
            (input)="onInput($event)"
            (keydown)="onKeydown($event)"
            placeholder="Pesquisar notas por título ou conteúdo..."
            class="flex-1 bg-transparent text-text text-sm outline-none placeholder:text-text-muted"
            autofocus
          />
          <kbd class="text-[10px] text-text-muted bg-surface-3 px-1.5 py-0.5 rounded border border-border">
            ESC
          </kbd>
        </div>

        
        <div class="flex-1 overflow-y-auto">
          @if (isLoading()) {
            <div class="flex items-center justify-center py-8">
              <span class="inline-block w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></span>
            </div>
          } @else if (filteredNotes().length > 0) {
            <ul role="listbox">
              @for (note of filteredNotes(); track note.id; let i = $index) {
                <li
                  role="option"
                  [attr.aria-selected]="i === selectedIndex()"
                  (click)="selectNote(i)"
                  (mouseenter)="selectedIndex.set(i)"
                  class="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
                  [class.bg-accent/10]="i === selectedIndex()"
                  [class.text-accent]="i === selectedIndex()"
                  [class.text-text]="i !== selectedIndex()"
                >
                  
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                       fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                       stroke-linejoin="round" class="shrink-0 text-text-muted">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>

                  <div class="flex-1 min-w-0">
                    
                    <div class="text-sm leading-tight truncate" [innerHTML]="highlight(note.title)"></div>
                    
                    <div class="text-[11px] text-text-muted mt-0.5 truncate">
                      {{ folderName(note.folderId) }}
                      @if (matchInContent(note)) {
                        <span class="ml-1.5 opacity-60">· conteúdo corresponde</span>
                      }
                    </div>
                  </div>

                  
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                       fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                       stroke-linejoin="round"
                       class="shrink-0"
                       [class.text-text-muted]="i !== selectedIndex()"
                       [class.text-accent]="i === selectedIndex()"
                  >
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </li>
              }
            </ul>
          } @else if (query()) {
            <div class="flex flex-col items-center justify-center py-10 text-text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                   stroke-linejoin="round" class="mb-2 opacity-50">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <p class="text-sm">Nenhuma nota encontrada para "{{ query() }}"</p>
            </div>
          }
        </div>

        
        <div class="px-4 py-2 border-t border-border flex items-center gap-3 text-[10px] text-text-muted">
          <span>↑↓ Navegar</span>
          <span>↵ Abrir</span>
          <span>ESC Fechar</span>
        </div>
      </div>
    }
  `,
})
export class QuickOpenComponent {
  private noteStore = inject(NoteStore);
  private folderStore = inject(FolderStore);
  private router = inject(Router);

  readonly isVisible = input(false);
  readonly close = output<void>();

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  
  doClose(): void {
    this.close.emit();
  }

  readonly query = signal('');
  readonly debouncedQuery = signal('');
  readonly selectedIndex = signal(0);
  readonly isLoading = signal(false);

  
  #debounceTimer: ReturnType<typeof setTimeout> | null = null;

  
  readonly filteredNotes = computed<NoteNode[]>(() => {
    const q = this.debouncedQuery().toLowerCase().trim();
    if (!q) return [];

    return this.noteStore
      .notes()
      .filter((n) => {
        if (n.title.toLowerCase().includes(q)) return true;
        if (n.content && n.content.toLowerCase().includes(q)) return true;
        return false;
      })
      .slice(0, 20);
  });

  
  constructor() {
    afterNextRender(() => {
      this.searchInput?.nativeElement?.focus();
    });
  }

  
  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
    this.selectedIndex.set(0);

    if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
    this.#debounceTimer = setTimeout(() => {
      this.debouncedQuery.set(value);
      this.#debounceTimer = null;
    }, 120);
  }

  
  onKeydown(event: KeyboardEvent): void {
    const results = this.filteredNotes();
    const maxIndex = results.length - 1;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex.update((i) => Math.min(i + 1, maxIndex));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex.update((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        this.selectNote(this.selectedIndex());
        break;
      case 'Escape':
        event.preventDefault();
        this.doClose();
        break;
    }
  }

  
  selectNote(index: number): void {
    const note = this.filteredNotes()[index];
    if (!note) return;
    this.doClose();
    this.router.navigate(['/app', 'editor', note.id]);
  }

  
  folderName(folderId: string): string {
    const folder = this.folderStore.folders().find((f) => f.id === folderId);
    return folder?.name ?? 'Sem pasta';
  }

  
  matchInContent(note: NoteNode): boolean {
    const q = this.debouncedQuery().toLowerCase().trim();
    if (!q || !note.content) return false;
    return note.content.toLowerCase().includes(q) && !note.title.toLowerCase().includes(q);
  }

  
  highlight(text: string): string {
    const q = this.debouncedQuery().toLowerCase().trim();
    if (!q) return this.#escapeHtml(text);

    const escaped = this.#escapeHtml(text);
    const regex = new RegExp(`(${this.#escapeRegex(q)})`, 'gi');
    return escaped.replace(regex, '<mark class="bg-accent/30 text-accent rounded-[2px] px-0.5">$1</mark>');
  }

  #escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  #escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
