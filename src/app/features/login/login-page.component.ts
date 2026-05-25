import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/toast/toast.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  readonly email = signal('');
  readonly password = signal('');
  readonly isSubmitting = signal(false);
  readonly inlineError = signal(false);
  readonly inlineErrorMessage = signal('');
  readonly emailFieldTouched = signal(false);
  readonly passwordFieldTouched = signal(false);

  onEmailBlur(): void {
    this.emailFieldTouched.set(true);
  }

  onPasswordBlur(): void {
    this.passwordFieldTouched.set(true);
  }

  async onSubmit(): Promise<void> {
    this.emailFieldTouched.set(true);
    this.passwordFieldTouched.set(true);

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email().trim());
    const passwordValid = this.password().length >= 6;

    if (!emailValid || !passwordValid) {
      return; 
    }

    if (!navigator.onLine) {
      this.inlineError.set(true);
      this.inlineErrorMessage.set('Sem conexão com a internet. Verifique sua rede.');
      return;
    }

    this.isSubmitting.set(true);
    this.inlineError.set(false);

    try {
      const { error } = await this.authService.signIn(
        this.email().trim(),
        this.password()
      );

      if (error) {
        if (error.message?.toLowerCase().includes('invalid_credentials') ||
            error.message?.toLowerCase().includes('invalid login') ||
            error.status === 400) {
          this.toastService.show('Email ou senha inválidos');
        } else if (error.message?.toLowerCase().includes('email not confirmed')) {
          this.toastService.show('Email não confirmado. Verifique sua caixa de entrada.');
        } else {
          this.inlineError.set(true);
          this.inlineErrorMessage.set('Não foi possível conectar ao servidor');
        }
        this.isSubmitting.set(false);
        return;
      }

      await this.router.navigate(['/app']);
    } catch {
      this.inlineError.set(true);
      this.inlineErrorMessage.set('Não foi possível conectar ao servidor');
      this.isSubmitting.set(false);
    }
  }

  onRetry(): void {
    this.inlineError.set(false);
    this.inlineErrorMessage.set('');
    this.onSubmit();
  }
}
