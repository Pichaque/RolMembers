import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonButton, IonContent } from '@ionic/angular';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ion-content [fullscreen]="true">
      <main class="page-wrap error-page">
        <p class="eyebrow">PÁGINA NO ENCONTRADA</p>
        <h1>Este camino no aparece en el mapa.</h1>
        <p>Puede que el enlace haya cambiado o que la página ya no esté disponible.</p>
        <ion-button routerLink="/" class="button-primary">Volver al inicio</ion-button>
      </main>
    </ion-content>
  `,
  styleUrl: './error.page.scss',
  imports: [IonButton, IonContent, RouterLink],
})
/** Ruta que no existe. */
export class NotFoundPage {}
