import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { adminGuard, permissionGuard, serverMemberGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', title: 'Inicio', loadComponent: () => import('./home/home.page').then((m) => m.HomePage) },
  {
    path: 'login',
    title: 'Iniciar sesión',
    loadComponent: () => import('./features/auth/auth.page').then((m) => m.AuthPage),
    canActivate: [guestGuard],
    data: { mode: 'login' },
  },
  {
    path: 'register',
    title: 'Crear cuenta',
    loadComponent: () => import('./features/auth/auth.page').then((m) => m.AuthPage),
    canActivate: [guestGuard],
    data: { mode: 'register' },
  },
  {
    path: 'dashboard',
    title: 'Mi espacio',
    loadComponent: () => import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    title: 'Perfil',
    loadComponent: () => import('./features/profile/profile.page').then((m) => m.ProfilePage),
    canActivate: [authGuard],
  },
  {
    path: 'calendar',
    title: 'Calendario',
    loadComponent: () => import('./features/calendar/calendar.page').then((m) => m.CalendarPage),
    canActivate: [authGuard],
  },
  {
    path: 'servers',
    title: 'Comunidades',
    loadComponent: () => import('./features/servers/servers.page').then((m) => m.ServersPage),
    canActivate: [authGuard],
  },
  {
    path: 'servers/:id/tablon',
    title: 'Tablón',
    loadComponent: () => import('./features/servers/tablon.page').then((m) => m.TablonPage),
    canActivate: [authGuard, serverMemberGuard],
  },
  {
    path: 'servers/:id/personajes',
    title: 'Personajes',
    loadComponent: () => import('./features/servers/characters.page').then((m) => m.CharactersPage),
    canActivate: [authGuard, serverMemberGuard],
  },
  {
    path: 'servers/:id',
    title: 'Comunidad',
    loadComponent: () => import('./features/servers/server-detail.page').then((m) => m.ServerDetailPage),
    canActivate: [authGuard, serverMemberGuard],
  },
  {
    path: 'admin',
    title: 'Administración',
    loadComponent: () => import('./features/admin/admin.page').then((m) => m.AdminPage),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'admin/dashboard',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/admin/admin-section-redirect.component').then((m) => m.AdminSectionRedirectComponent),
    data: { seccion: 'indicadores' },
  },
  {
    path: 'admin/informes',
    canActivate: [authGuard, permissionGuard('informes-globales')],
    loadComponent: () => import('./features/admin/admin-section-redirect.component').then((m) => m.AdminSectionRedirectComponent),
    data: { seccion: 'informes' },
  },
  {
    path: 'ayuda',
    title: 'Ayuda',
    loadComponent: () => import('./features/help/help.page').then((m) => m.HelpPage),
  },
  {
    path: 'forbidden',
    title: 'Sin permiso',
    loadComponent: () => import('./features/errors/forbidden.page').then((m) => m.ForbiddenPage),
  },
  {
    path: 'auth-error',
    title: 'Error de sesión',
    loadComponent: () => import('./features/errors/auth-error.page').then((m) => m.AuthErrorPage),
  },
  {
    path: '**',
    title: 'No encontrada',
    loadComponent: () => import('./features/errors/not-found.page').then((m) => m.NotFoundPage),
  },
];
