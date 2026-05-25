import { Routes } from '@angular/router';
import { LoginPageComponent } from './features/login/login-page.component';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginPageComponent,
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadChildren: () => import('./features/shell/shell.routes').then(m => m.shellRoutes),
  },
  {
    path: '',
    redirectTo: '/app',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/app',
  },
];
