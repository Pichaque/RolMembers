import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { CommunityServer, MembershipRef } from '../models/community.models';
import { Permiso, puede, Rol } from '../permissions/permissions';
import { CommunityService } from '../services/community.service';
import { SessionStore } from './session.store';

type CommunityState = {
  communities: CommunityServer[];
  memberships: MembershipRef[];
  activeServerId: string | null;
  loadedFor: string | null;
};

/**
 * Comunidades del usuario y el rol con el que se calculan los permisos.
 */
export const CommunityStore = signalStore(
  { providedIn: 'root' },
  withState<CommunityState>({
    communities: [],
    memberships: [],
    activeServerId: null,
    loadedFor: null,
  }),
  withComputed((store) => {
    const session = inject(SessionStore);
    const activeRole = computed((): Rol | null => {
      if (session.isAdmin()) {
        return 'admin';
      }
      const activeId = store.activeServerId();
      if (!activeId) {
        return null;
      }
      return store.memberships().find((item) => item.serverId === activeId)?.role ?? null;
    });
    return { activeRole };
  }),
  withMethods((store) => {
    const session = inject(SessionStore);
    const communities = inject(CommunityService);
    return {
      /** Marca la comunidad de la ruta para que `can` use ese rol. */
      setActive(serverId: string | null): void {
        patchState(store, { activeServerId: serverId });
      },
      /** Carga membresías del usuario de la sesión. */
      async ensureLoaded(): Promise<void> {
        await session.ensure();
        const userId = session.user()?.id ?? null;
        if (!userId) {
          patchState(store, { communities: [], memberships: [], loadedFor: null });
          return;
        }
        if (store.loadedFor() === userId) {
          return;
        }
        const [memberships, list] = await Promise.all([
          communities.listMemberships(userId),
          communities.listForUser(userId),
        ]);
        patchState(store, { memberships, communities: list, loadedFor: userId });
      },
      /** Obliga a releer tras crear, unirse o borrar. */
      invalidate(): void {
        patchState(store, { loadedFor: null });
      },
      /**
       * @param permiso Acción de la matriz.
       * @param creador Si el usuario creó la comunidad activa.
       */
      can(permiso: Permiso, creador = false): boolean {
        const autenticado = Boolean(session.user());
        const active = store.activeRole();
        if (active) {
          return puede(permiso, active, autenticado, creador);
        }
        if (puede(permiso, null, autenticado, creador)) {
          return true;
        }
        return store.memberships().some((item) => puede(permiso, item.role, autenticado, false));
      },
    };
  }),
);
