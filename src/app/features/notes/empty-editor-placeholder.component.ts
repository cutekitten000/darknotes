import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-empty-editor-placeholder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center h-full text-center px-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48" height="48" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="1.5"
        stroke-linecap="round" stroke-linejoin="round"
        class="text-text-muted mb-4 opacity-40"
      >
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
      </svg>
      <h2 class="text-base font-medium text-text-muted mb-1">Nenhuma nota selecionada</h2>
      <p class="text-sm text-text-muted/60 max-w-[240px]">
        Clique em uma nota na barra lateral para editá-la, ou crie uma nova.
      </p>
    </div>
  `,
})
export class EmptyEditorPlaceholderComponent {}
