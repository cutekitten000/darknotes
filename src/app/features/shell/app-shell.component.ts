import { Component, signal, inject, DestroyRef, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/auth/auth.service';
import { FolderStore } from '../../core/folders/folder.store';
import { NoteStore } from '../../core/notes/note.store';
import { FolderListHeaderComponent } from '../folders/folder-list-header.component';
import { FolderTreeComponent } from '../folders/folder-tree.component';
import { QuickOpenComponent } from '../../shared/quick-open/quick-open.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    FolderListHeaderComponent,
    FolderTreeComponent,
    QuickOpenComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-shell.component.html',
})
export class AppShellComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  readonly store = inject(FolderStore);
  readonly noteStore = inject(NoteStore);
  readonly isLoggingOut = signal(false);
  readonly sidebarOpen = signal(true);
  readonly quickOpenVisible = signal(false);

  constructor() {
    this.noteStore.loadNotes();

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      if (window.innerWidth < 768) {
        this.sidebarOpen.set(false);
      }
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  
  @HostListener('window:keydown.control.p', ['$event'])
  @HostListener('window:keydown.meta.p', ['$event'])
  onQuickOpenKey(event: Event): void {
    event.preventDefault();
    this.quickOpenVisible.set(true);
  }

  onQuickOpenClose(): void {
    this.quickOpenVisible.set(false);
  }

  async onLogout(): Promise<void> {
    this.isLoggingOut.set(true);
    try {
      await this.authService.signOut();
    } catch {
      this.isLoggingOut.set(false);
    }
  }
}
