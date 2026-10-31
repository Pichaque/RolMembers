/** Rol de aplicación: administrador global o rol dentro de una comunidad. */
export type Rol = 'admin' | 'narrator' | 'player';

/** Acción que la interfaz puede mostrar u ocultar. La seguridad real sigue siendo RLS. */
export type Permiso =
  | 'ver-servidores'
  | 'ver-calendario'
  | 'ver-comunidad'
  | 'crear-comunidad'
  | 'eliminar-comunidad'
  | 'editar-comunidad'
  | 'gestionar-miembros'
  | 'regenerar-invitacion'
  | 'crear-evento'
  | 'editar-evento'
  | 'borrar-evento'
  | 'publicar-anuncio'
  | 'aprobar-personaje'
  | 'crear-personaje'
  | 'confirmar-asistencia'
  | 'tirar-dados'
  | 'ver-admin'
  | 'informes-globales'
  | 'informes-comunidad';

/**
 * Matriz única de permisos.
 * `eliminar-comunidad` solo lista al administrador: el creador se comprueba aparte en `puede`.
 */
export const PERMISSIONS: Record<Permiso, Rol[]> = {
  'ver-servidores': ['admin', 'narrator', 'player'],
  'ver-calendario': ['admin', 'narrator', 'player'],
  'ver-comunidad': ['admin', 'narrator', 'player'],
  'crear-comunidad': ['admin', 'narrator', 'player'],
  'eliminar-comunidad': ['admin'],
  'editar-comunidad': ['admin', 'narrator'],
  'gestionar-miembros': ['admin', 'narrator'],
  'regenerar-invitacion': ['admin', 'narrator'],
  'crear-evento': ['admin', 'narrator'],
  'editar-evento': ['admin', 'narrator'],
  'borrar-evento': ['admin', 'narrator'],
  'publicar-anuncio': ['admin', 'narrator'],
  'aprobar-personaje': ['admin', 'narrator'],
  'crear-personaje': ['admin', 'narrator', 'player'],
  'confirmar-asistencia': ['admin', 'narrator', 'player'],
  'tirar-dados': ['admin', 'narrator', 'player'],
  'ver-admin': ['admin'],
  'informes-globales': ['admin'],
  'informes-comunidad': ['admin', 'narrator'],
};

const ANY_AUTHENTICATED = new Set<Permiso>(['ver-servidores', 'ver-calendario', 'crear-comunidad']);

/**
 * Decide si un rol puede realizar la acción.
 * @param permiso Acción consultada.
 * @param rol Rol activo. `null` si no hay comunidad seleccionada y no es administrador.
 * @param autenticado Si hay sesión.
 * @param creador Si el usuario creó la comunidad activa. Solo afecta a eliminar.
 * @returns `true` cuando la interfaz debe mostrar la acción.
 */
export function puede(
  permiso: Permiso,
  rol: Rol | null,
  autenticado: boolean,
  creador = false,
): boolean {
  if (!autenticado) {
    return false;
  }
  if (permiso === 'eliminar-comunidad') {
    return rol === 'admin' || creador;
  }
  if (ANY_AUTHENTICATED.has(permiso)) {
    return true;
  }
  if (!rol) {
    return false;
  }
  return PERMISSIONS[permiso].includes(rol);
}
