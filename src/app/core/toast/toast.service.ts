import { Injectable, signal } from '@angular/core';

export type ToastType = 'error' | 'success' | 'info';

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly message = signal<string | null>(null);
  readonly visible = signal(false);
  readonly toastType = signal<ToastType>('error');
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;

  show(message: string, type: ToastType = 'error'): void {
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
    }
    this.message.set(message);
    this.toastType.set(type);
    this.visible.set(true);
    this.dismissTimer = setTimeout(() => this.dismiss(), 4000);
  }

  dismiss(): void {
    this.visible.set(false);
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
    setTimeout(() => {
      if (!this.visible()) {
        this.message.set(null);
      }
    }, 300);
  }

  pauseDismiss(): void {
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
  }

  resumeDismiss(): void {
    if (this.message()) {
      this.dismissTimer = setTimeout(() => this.dismiss(), 4000);
    }
  }
}
