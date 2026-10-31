import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular';

/** Página accesible cuando falta un permiso. No redirige al login. */
@Component({
  selector: 'app-forbidden',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, IonContent, RouterLink],
  template: `
    <ion-content>
      <main class="page-wrap error-page">
        <p class="eyebrow">SIN PERMISO</p>
        <h1>No puedes entrar aquí</h1>
        <p>Tu rol no incluye esta sección. Si crees que es un error, pide a un narrador o a un administrador que lo revise.</p>
        <ion-button routerLink="/dashboard" class="button-primary">Volver a mi espacio</ion-button>
      </main>
    </ion-content>
  `,
})
/** Acceso denegado para el rol actual. */
export class ForbiddenPage {}
