/** Filas ya leídas que el panel convierte en series. */
export interface FuenteInforme {
  servidores: Array<{ id: string; name: string }>;
  personajes: Array<{ server_id: string; created_at: string }>;
  eventos: Array<{ id: string; server_id: string; starts_at: string }>;
  miembros: Array<{ server_id: string; role: string }>;
  asistencia: Array<{ event_id: string; server_id: string; status: string }>;
  administradores: number;
  comunidad: string;
  desde: string;
  hasta: string;
}

/** Series y filas del informe, recalculadas al filtrar. */
export interface ResumenInforme {
  servidores: Array<{ id: string; name: string }>;
  personajes: number;
  sesiones: number;
  etiquetas: string[];
  porComunidad: number[];
  meses: string[];
  porMes: number[];
  roles: number[];
  asistenciaYes: number[];
  asistenciaMaybe: number[];
  asistenciaNo: number[];
  filas: string[][];
}

/**
 * Agrupa personajes, sesiones, roles y asistencia.
 * @param fuente Datos y filtro de comunidad y fechas.
 */
export function resumirInforme(fuente: FuenteInforme): ResumenInforme {
  const servers = fuente.servidores.filter((server) => !fuente.comunidad || server.id === fuente.comunidad);
  const names = new Map(servers.map((server) => [server.id, server.name]));
  const characters = fuente.personajes.filter((row) => names.has(row.server_id) && enRango(row.created_at, fuente.desde, fuente.hasta));
  const events = fuente.eventos.filter((row) => names.has(row.server_id) && enRango(row.starts_at, fuente.desde, fuente.hasta));
  const eventIds = new Set(events.map((row) => row.id));
  const attendance = fuente.asistencia.filter((row) => eventIds.has(row.event_id));
  const members = fuente.miembros.filter((row) => names.has(row.server_id));
  const porComunidad = servers.map((server) => characters.filter((row) => row.server_id === server.id).length);
  const meses = [...new Set(events.map((row) => row.starts_at.slice(0, 7)))].sort();
  const asistencia = (status: string) => servers.map((server) => attendance.filter((row) => row.server_id === server.id && row.status === status).length);
  return {
    servidores: servers,
    personajes: porComunidad.reduce((sum, value) => sum + value, 0),
    sesiones: events.length,
    etiquetas: servers.map((server) => server.name),
    porComunidad,
    meses: meses.map((mes) => etiquetaMes(mes)),
    porMes: meses.map((mes) => events.filter((row) => row.starts_at.startsWith(mes)).length),
    roles: [
      fuente.administradores,
      members.filter((row) => row.role === 'narrator').length,
      members.filter((row) => row.role === 'player').length,
    ],
    asistenciaYes: asistencia('yes'),
    asistenciaMaybe: asistencia('maybe'),
    asistenciaNo: asistencia('no'),
    filas: servers.map((server, index) => [
      server.name,
      String(porComunidad[index] ?? 0),
      String(events.filter((row) => row.server_id === server.id).length),
      String(asistencia('yes')[index] ?? 0),
    ]),
  };
}

function enRango(iso: string, desde: string, hasta: string): boolean {
  const day = iso.slice(0, 10);
  if (desde && day < desde) {
    return false;
  }
  if (hasta && day > hasta) {
    return false;
  }
  return true;
}

function etiquetaMes(value: string): string {
  const [year, month] = value.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat('es', { month: 'short', year: 'numeric' }).format(date);
}
