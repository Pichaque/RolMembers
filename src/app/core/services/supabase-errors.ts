/** Traduce errores de las RPC de comunidad a español. */
export function mapCommunityRpc(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes('limite de 3') || normalized.includes('límite de 3')) {
    return 'Has alcanzado el límite de 3 comunidades creadas.';
  }
  if (normalized.includes('no autenticado')) {
    return 'Necesitas iniciar sesión.';
  }
  if (normalized.includes('prohibido')) {
    return 'No tienes permiso para hacer eso.';
  }
  if (normalized.includes('creador')) {
    return 'No se puede quitar ni degradar al creador de la comunidad.';
  }
  if (normalized.includes('no existe')) {
    return 'La comunidad no existe.';
  }
  if (normalized.includes('could not find the function') || normalized.includes('schema cache')) {
    return 'Falta aplicar en Supabase la migración de comunidades. Hasta entonces esta acción no está disponible.';
  }
  return message || 'No se pudo completar la acción.';
}

/** Traduce el error de unirse con un código. */
export function mapJoinError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes('no autenticado')) {
    return 'Necesitas iniciar sesión para usar una invitación.';
  }
  if (normalized.includes('no valido') || normalized.includes('no válido')) {
    return 'El código de invitación no es válido.';
  }
  return 'No se pudo unir a la comunidad. Comprueba el código y vuelve a intentarlo.';
}

/** Convierte un nombre visible en el slug que exige la base. */
export function toCommunitySlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
