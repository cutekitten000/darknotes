import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [NgIf],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      *ngIf="toastService.message()"
      role="alert"
      aria-live="assertive"
      class="fixed top-4 right-4 z-50 max-w-[360px] rounded-[4px] px-4 py-3 shadow-lg transition-all duration-300"
      [class.bg-toast-error-bg]="toastService.toastType() === 'error'"
      [class.bg-toast-success-bg]="toastService.toastType() === 'success'"
      [class.bg-toast-info-bg]="toastService.toastType() === 'info'"
      [class.border-l-4]="true"
      [class.border-destructive]="toastService.toastType() === 'error'"
      [class.border-toast-success-border]="toastService.toastType() === 'success'"
      [class.border-toast-info-border]="toastService.toastType() === 'info'"
      [class.translate-x-0]="toastService.visible()"
      [class.translate-x-full]="!toastService.visible()"
      (mouseenter)="toastService.pauseDismiss()"
      (mouseleave)="toastService.resumeDismiss()"
    >
      <div class="flex items-start gap-3">
        <p class="text-sm text-text flex-1">{{ toastService.message() }}</p>
        <button
          (click)="toastService.dismiss()"
          aria-label="Fechar"
          class="text-text-muted hover:text-text shrink-0 text-sm leading-none"
        >
          ✕
        </button>
      </div>
    </div>
  `,
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}
