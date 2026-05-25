import { Injectable, signal, DestroyRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { User, AuthError } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService).supabase;
  private router = inject(Router);

  readonly user = signal<User | null>(null);
  readonly isAuthenticated = signal(false);
  readonly isLoadingSession = signal(true); 
  readonly sessionExpired = signal(false);
  private wasManualSignOut = false;

  constructor() {
    this.supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        this.user.set(data.session.user);
        this.isAuthenticated.set(true);
      }
      this.isLoadingSession.set(false);
    });

    const { data: authListener } = this.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        this.user.set(session?.user ?? null);
        this.isAuthenticated.set(true);
      } else if (event === 'SIGNED_OUT') {
        this.user.set(null);
        this.isAuthenticated.set(false);
        if (!this.wasManualSignOut) {
          this.sessionExpired.set(true);
        }
        this.wasManualSignOut = false;
      }
    });

    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => {
      authListener?.subscription.unsubscribe();
    });
  }

  async signIn(email: string, password: string): Promise<{ error?: AuthError }> {
    const { error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error };
    return {};
  }

  async signOut(): Promise<void> {
    this.wasManualSignOut = true;
    this.sessionExpired.set(false);
    await this.supabase.auth.signOut();
    this.router.navigate(['/login']);
  }
}
