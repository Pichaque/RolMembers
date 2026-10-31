import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IonButton, IonHeader, IonIcon, IonMenuButton, IonToolbar } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { MenuStore } from '../../core/stores/menu.store';
import { SessionStore } from '../../core/stores/session.store';

@Component({
  selector: 'app-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ion-header class="site-header">
      <ion-toolbar>
        <div class="header-inner">
          @if (auth.user()) {
            <ion-menu-button
              class="app-header__menu"
              menu="app-menu"
              [attr.aria-label]="menu.open() ? 'Cerrar menú' : 'Abrir menú'"
            />
          }
          <a class="brand" routerLink="/" aria-label="Comunidad de Rol, inicio">
            <span class="brand-mark"><ion-icon name="compass-outline" /></span>
            <span>comunidad<span class="brand-accent">de rol</span></span>
          </a>
          <nav class="header-nav" aria-label="Navegación principal">
            @if (auth.user()) {
              <a routerLink="/dashboard" routerLinkActive="active">Mi espacio</a>
              <a routerLink="/calendar" routerLinkActive="active">Calendario</a>
              <a routerLink="/servers" routerLinkActive="active">Comunidades</a>
              @if (session.isAdmin()) {
                <a routerLink="/admin" routerLinkActive="active">Administración</a>
              }
              <span class="apariencia" role="group" aria-label="Apariencia">
                <button type="button" class="apariencia__icon" (click)="theme.cycleScheme()" [attr.aria-label]="'Tema: ' + etiquetaTema() + '. Cambiar'">
                  <ion-icon [name]="iconoTema()" aria-hidden="true" />
                </button>
                <button type="button" class="apariencia__icon" (click)="theme.cambiarTexto(-1)" aria-label="Reducir el tamaño del texto" [disabled]="theme.textStep() <= -1">
                  <ion-icon name="remove-outline" aria-hidden="true" />
                </button>
                <button type="button" class="apariencia__icon" (click)="theme.cambiarTexto(1)" aria-label="Aumentar el tamaño del texto" [disabled]="theme.textStep() >= 2">
                  <ion-icon name="add-outline" aria-hidden="true" />
                </button>
              </span>
              <ion-button fill="clear" class="header-action" (click)="signOut()" [disabled]="signingOut()">
                <ion-icon slot="start" name="log-out-outline" /> Salir
              </ion-button>
            } @else {
              <span class="apariencia" role="group" aria-label="Apariencia">
                <button type="button" class="apariencia__icon" (click)="theme.cycleScheme()" [attr.aria-label]="'Tema: ' + etiquetaTema() + '. Cambiar'">
                  <ion-icon [name]="iconoTema()" aria-hidden="true" />
                </button>
                <button type="button" class="apariencia__icon" (click)="theme.cambiarTexto(-1)" aria-label="Reducir el tamaño del texto" [disabled]="theme.textStep() <= -1">
                  <ion-icon name="remove-outline" aria-hidden="true" />
                </button>
                <button type="button" class="apariencia__icon" (click)="theme.cambiarTexto(1)" aria-label="Aumentar el tamaño del texto" [disabled]="theme.textStep() >= 2">
                  <ion-icon name="add-outline" aria-hidden="true" />
                </button>
              </span>
              <a routerLink="/login" routerLinkActive="active">Iniciar sesión</a>
              <ion-button routerLink="/register" class="header-join">Crear cuenta <ion-icon slot="end" name="arrow-forward-outline" /></ion-button>
            }
          </nav>
        </div>
      </ion-toolbar>
    </ion-header>
    @if (error()) {
      <p class="header-error" role="alert">{{ error() }}</p>
    }
  `,
  imports: [IonButton, IonHeader, IonIcon, IonMenuButton, IonToolbar, RouterLink, RouterLinkActive],
})
/** Cabecera con navegación, tema y tamaño de texto. */
export class AppHeaderComponent {
  readonly signingOut = signal(false);
  readonly error = signal('');

  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly menu = inject(MenuStore);
  readonly session = inject(SessionStore);
  private readonly router = inject(Router);

  etiquetaTema(): string {
    const preference = this.theme.preference();
    if (preference === 'light') {
      return 'Claro';
    }
    if (preference === 'dark') {
      return 'Oscuro';
    }
    return 'Sistema';
  }

  iconoTema(): string {
    const preference = this.theme.preference();
    if (preference === 'light') {
      return 'sunny-outline';
    }
    if (preference === 'dark') {
      return 'moon-outline';
    }
    return 'contrast-outline';
  }

  async signOut(): Promise<void> {
    this.signingOut.set(true);
    this.error.set('');
    try {
      await this.auth.signOut();
      await this.router.navigateByUrl('/');
    } catch {
      this.error.set('No se pudo cerrar la sesión. Inténtalo de nuevo.');
    } finally {
      this.signingOut.set(false);
    }
  }
}
