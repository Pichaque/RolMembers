import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { AuthService } from '../services/auth.service';
import { ProfileService, UserProfile } from '../services/profile.service';

type SessionState = {
  ready: boolean;
  profile: UserProfile | null;
};

/**
 * Sesión, usuario y perfil. Las páginas no vuelven a pedir el perfil por su cuenta.
 */
export const SessionStore = signalStore(
  { providedIn: 'root' },
  withState<SessionState>({ ready: false, profile: null }),
  withComputed((store) => {
    const auth = inject(AuthService);
    return {
      user: computed(() => auth.user()),
      isAdmin: computed(() => store.profile()?.global_role === 'admin'),
    };
  }),
  withMethods((store) => {
    const auth = inject(AuthService);
    const profiles = inject(ProfileService);
    let pending: Promise<void> | null = null;

    const load = async (): Promise<void> => {
      await auth.initialize();
      const user = auth.user();
      if (store.ready() && (store.profile()?.id ?? null) === (user?.id ?? null)) {
        return;
      }
      if (!user) {
        patchState(store, { ready: true, profile: null });
        return;
      }
      const profile = await profiles.getProfile(user.id);
      patchState(store, { ready: true, profile });
    };

    return {
      /** Espera a la sesión y carga el perfil del usuario actual. */
      ensure(): Promise<void> {
        pending ??= load().finally(() => {
          pending = null;
        });
        return pending;
      },
      /** Vuelve a leer el perfil, por ejemplo tras cambiar el rol global. */
      async reload(): Promise<void> {
        patchState(store, { ready: false });
        await load();
      },
      /** Limpia el perfil tras cerrar sesión. */
      clear(): void {
        patchState(store, { ready: true, profile: null });
      },
    };
  }),
);
