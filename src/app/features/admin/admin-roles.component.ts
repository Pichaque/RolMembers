import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService, UserProfile } from '../../core/services/profile.service';
import { SessionStore } from '../../core/stores/session.store';

/** Gestión de roles globales para administradores. */
@Component({
  selector: 'app-admin-roles',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './admin-roles.component.html',
  styleUrl: './admin-roles.component.scss',
})
export class AdminRolesComponent implements OnInit {
  readonly accounts = signal<UserProfile[]>([]);
  readonly roleError = signal('');
  readonly roleSuccess = signal('');

  private readonly auth = inject(AuthService);
  private readonly session = inject(SessionStore);
  private readonly profiles = inject(ProfileService);

  ngOnInit(): void {
    void this.loadAccounts();
  }

  etiquetaCuenta(account: UserProfile): string {
    const nombre = account.display_name?.trim() || 'Sin nombre';
    const sufijo = account.id.slice(-4);
    return `${nombre} · …${sufijo}`;
  }

  private async loadAccounts(): Promise<void> {
    try {
      await this.session.ensure();
      this.accounts.set(await this.profiles.listProfiles());
    } catch (error: unknown) {
      this.roleError.set(error instanceof Error ? error.message : 'No se pudieron cargar las cuentas.');
    }
  }

  async changeGlobalRole(account: UserProfile, event: Event): Promise<void> {
    if (!(event.target instanceof HTMLSelectElement)) {
      return;
    }
    const role = event.target.value;
    if ((role !== 'admin' && role !== 'user') || role === account.global_role) {
      return;
    }

    this.roleError.set('');
    this.roleSuccess.set('');
    try {
      await this.profiles.setGlobalRole(account.id, role);
      await this.session.reload();
      this.roleSuccess.set(account.id === this.auth.user()?.id
        ? 'Has cambiado tu propio rol global.'
        : 'Rol global actualizado.');
      await this.loadAccounts();
    } catch (error: unknown) {
      event.target.value = account.global_role;
      this.roleError.set(error instanceof Error ? error.message : 'No se pudo cambiar el rol global.');
    }
  }
}
