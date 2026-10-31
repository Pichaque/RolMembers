import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular';
import { AdminAnalyticsComponent } from './admin-analytics.component';
import { AdminRolesComponent } from './admin-roles.component';

type AdminSeccion = 'roles' | 'indicadores' | 'informes';

/** Panel principal del administrador global. */
@Component({
  selector: 'app-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdminAnalyticsComponent, AdminRolesComponent, IonButton, IonContent],
  templateUrl: './admin.page.html',
  styleUrl: './admin.page.scss',
})
export class AdminPage implements OnInit {
  readonly seccion = signal<AdminSeccion>('roles');

  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const value = params.get('seccion');
      if (value === 'indicadores' || value === 'informes' || value === 'roles') {
        this.seccion.set(value);
      }
    });
  }

  elegir(seccion: AdminSeccion): void {
    this.seccion.set(seccion);
  }
}
