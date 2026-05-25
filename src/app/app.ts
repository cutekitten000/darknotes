import { Component, computed, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { ToastService } from './core/toast/toast.service';
import { SkeletonLayoutComponent } from './features/shell/skeleton-layout.component';
import { ToastComponent } from './core/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SkeletonLayoutComponent, ToastComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  readonly isLoading = computed(() => this.authService.isLoadingSession());

  constructor() {
    effect(() => {
      if (this.authService.sessionExpired()) {
        this.toastService.show('Sessão expirada. Faça login novamente.');
      }
    });
  }
}
