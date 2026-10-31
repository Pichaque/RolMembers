import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IonButton, IonContent, IonIcon, IonSpinner } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { signal } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ion-content [fullscreen]="true">
      <main class="page-wrap error-page">
        <span class="error-icon"><ion-icon name="alert-circle-outline" /></span>
        <p class="eyebrow">CONEXIÓN NO DISPONIBLE</p>
        <h1>No pudimos recuperar tu sesión</h1>
        <p>{{ auth.initializationError() || 'El servicio de autenticación no está disponible en este momento.' }}</p>
        <ion-button (click)="retry()" class="button-primary" [disabled]="retrying()">
          @if (retrying()) { <ion-spinner name="crescent" /> }
          @else { Reintentar conexión }
        </ion-button>
        <ion-button routerLink="/" fill="clear">Volver al inicio</ion-button>
      </main>
    </ion-content>
  `,
  styleUrl: './error.page.scss',
  imports: [IonButton, IonContent, IonIcon, IonSpinner, RouterLink],
})
/** Aviso cuando no se pudo restaurar la sesión. */
export class AuthErrorPage {
  readonly auth = inject(AuthService);
  readonly retrying = signal(false);
  private readonly router = inject(Router);

  async retry(): Promise<void> {
    this.retrying.set(true);
    const initialized = await this.auth.initialize();
    this.retrying.set(false);
    if (initialized) {
      await this.router.navigateByUrl(this.auth.user() ? '/dashboard' : '/');
    }
  }
}
