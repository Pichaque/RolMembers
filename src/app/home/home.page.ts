import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IonButton, IonContent, IonIcon } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.page.html',
  imports: [IonButton, IonContent, IonIcon, RouterLink],
})
/** Portada pública. */
export class HomePage {
  readonly auth = inject(AuthService);
}
