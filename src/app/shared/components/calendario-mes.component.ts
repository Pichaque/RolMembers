import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/** Evento que pinta el mes. El color nunca va solo: también hay nombre. */
export interface EventoCalendario {
  id: string;
  dia: number;
  titulo: string;
  comunidad: string;
  color: string;
}

/**
 * Rejilla mensual. Cada día es un botón y se recorre con el teclado.
 */
@Component({
  selector: 'app-calendario-mes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendario-mes.component.html',
  styleUrl: './calendario-mes.component.scss',
})
/** Rejilla mensual accesible. No consulta datos. */
export class CalendarioMesComponent {
  readonly anio = input.required<number>();
  readonly mes = input.required<number>();
  readonly eventos = input<EventoCalendario[]>([]);
  readonly diaSeleccionado = output<Date>();
  readonly eventoSeleccionado = output<string>();
  readonly mesCambiado = output<Date>();

  readonly etiqueta = computed(() => new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(new Date(this.anio(), this.mes(), 1)));
  readonly celdas = computed(() => {
    const first = new Date(this.anio(), this.mes(), 1);
    const offset = (first.getDay() + 6) % 7;
    const days = new Date(this.anio(), this.mes() + 1, 0).getDate();
    return Array.from({ length: offset + days }, (_, index) => index < offset ? null : index - offset + 1);
  });

  fecha(dia: number): Date {
    return new Date(this.anio(), this.mes(), dia);
  }

  eventosDelDia(dia: number): EventoCalendario[] {
    return this.eventos().filter((evento) => evento.dia === dia);
  }

  etiquetaDia(dia: number): string {
    const fecha = new Date(this.anio(), this.mes(), dia);
    const nombre = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long' }).format(fecha);
    const total = this.eventosDelDia(dia).length;
    return total ? `${nombre}, ${total} sesiones` : nombre;
  }

  moverMes(delta: number): void {
    this.mesCambiado.emit(new Date(this.anio(), this.mes() + delta, 1));
  }

  tecla(event: KeyboardEvent, dia: number): void {
    const actual = new Date(this.anio(), this.mes(), dia);
    const saltos: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: 1 - dia, End: new Date(this.anio(), this.mes() + 1, 0).getDate() - dia };
    if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault();
      this.moverMes(event.key === 'PageUp' ? -1 : 1);
      return;
    }
    const salto = saltos[event.key];
    if (salto === undefined) {
      return;
    }
    event.preventDefault();
    const destino = new Date(actual);
    destino.setDate(actual.getDate() + salto);
    if (destino.getMonth() !== this.mes()) {
      this.mesCambiado.emit(new Date(destino.getFullYear(), destino.getMonth(), 1));
    }
    this.diaSeleccionado.emit(destino);
    queueMicrotask(() => document.getElementById(this.idDia(destino.getDate()))?.focus());
  }

  idDia(dia: number): string {
    return `dia-${this.anio()}-${this.mes()}-${dia}`;
  }
}
