import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { UserProfile } from '../../core/services/profile.service';
import { SessionStore } from '../../core/stores/session.store';

@Component({
  selector: 'app-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
  imports: [IonContent, IonIcon],
})
/** Datos de la cuenta. */
export class ProfilePage implements OnInit {
  readonly profile = signal<UserProfile | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly auth = inject(AuthService);
  private readonly session = inject(SessionStore);

  ngOnInit(): void {
    void this.loadProfile();
  }

  private async loadProfile(): Promise<void> {
    const user = this.auth.user();
    if (!user) {
      this.loading.set(false);
      return;
    }

    try {
      await this.session.ensure();
      const profile = this.session.profile();
      this.profile.set(profile);
    } catch {
      this.error.set('No se pudo cargar el perfil desde Supabase. Comprueba los permisos de lectura de la tabla profiles.');
    } finally {
      this.loading.set(false);
    }
  }
}
