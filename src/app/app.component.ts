import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonApp, IonContent, IonLabel, IonMenu, IonRouterOutlet, IonTabBar, IonTabButton } from '@ionic/angular';
import { MenuStore } from './core/stores/menu.store';
import { filter } from 'rxjs';
import { Permiso } from './core/permissions/permissions';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { CommunityStore } from './core/stores/community.store';
import { SessionStore } from './core/stores/session.store';
import { AppHeaderComponent } from './shared/components/app-header.component';

interface NavLink {
  path: string;
  label: string;
  permiso: Permiso | null;
}

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'app.component.html',
  imports: [
    AppHeaderComponent,
    IonApp,
    IonContent,
    IonLabel,
    IonMenu,
    IonRouterOutlet,
    IonTabBar,
    IonTabButton,
    RouterLink,
    RouterLinkActive,
  ],
})
/** Cascarón de la aplicación: menú, cabecera y salida de rutas. */
export class AppComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly theme = inject(ThemeService);
  readonly session = inject(SessionStore);
  private readonly community = inject(CommunityStore);
  private readonly menuStore = inject(MenuStore);

  private readonly allLinks: NavLink[] = [
    { path: '/dashboard', label: 'Inicio', permiso: 'ver-servidores' },
    { path: '/servers', label: 'Comunidades', permiso: 'ver-servidores' },
    { path: '/calendar', label: 'Calendario', permiso: 'ver-calendario' },
    { path: '/admin', label: 'Admin', permiso: 'ver-admin' },
    { path: '/ayuda', label: 'Ayuda', permiso: null },
    { path: '/profile', label: 'Perfil', permiso: null },
  ];

  readonly links = computed(() => this.allLinks.filter((link) => !link.permiso || this.community.can(link.permiso)));

  constructor() {
    void this.session.ensure().then(() => this.community.ensureLoaded());
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        const path = event.urlAfterRedirects.split(/[?#]/, 1)[0];
        if (!/^\/servers\/[^/]+/.test(path)) {
          this.theme.reset();
          this.community.setActive(null);
        }
      });
    void this.auth.initialize();
  }

  /** Guarda el estado del menú; siempre arranca cerrado al cargar la app. */
  onMenuOpen(open: boolean): void {
    this.menuStore.persist(open);
  }
}
