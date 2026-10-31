import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Nota del corcho. La inclinación sale del id, no del azar. */
export interface NotaTablon {
  id: string;
  titulo: string;
  detalle: string;
  comunidad: string;
  color: string;
}

/** Tablón de corcho en CSS, sin imagen. */
@Component({
  selector: 'app-tablon-eventos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tablon-eventos.component.html',
  styleUrl: './tablon-eventos.component.scss',
})
/** Notas del corcho. No consulta datos. */
export class TablonEventosComponent {
  readonly notas = input<NotaTablon[]>([]);

  inclinacion(id: string): string {
    const code = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return `${(code % 17) - 8}deg`;
  }

  desplazamientoPin(id: string): string {
    const code = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return `${(code % 9) - 4}px`;
  }
}
