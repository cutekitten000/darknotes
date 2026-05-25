import { Routes } from '@angular/router';
import { AppShellComponent } from './app-shell.component';

export const shellRoutes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: '', loadComponent: () => import('../notes/folder-content.component').then(m => m.FolderContentComponent) },
      { path: 'editor/:id', loadComponent: () => import('../notes/note-editor.component').then(m => m.NoteEditorComponent) },
    ],
  },
];
