import { ChangeDetectionStrategy, Component, computed, input, model, output, signal } from '@angular/core';

/** Columna visible de la tabla. */
export interface ColumnaTabla {
  titulo: string;
}

/** Fila de texto ya preparada por la página. */
export interface FilaTabla {
  id: string;
  celdas: string[];
}

/**
 * Tabla con búsqueda, orden y paginación. No consulta datos.
 */
@Component({
  selector: 'app-tabla-datos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tabla-datos.component.html',
  styleUrl: './tabla-datos.component.scss',
})
/** Tabla con búsqueda, orden y paginación. No consulta datos. */
export class TablaDatosComponent {
  readonly columnas = input.required<ColumnaTabla[]>();
  readonly filas = input.required<FilaTabla[]>();
  readonly titulo = input('Datos');
  readonly valor = model('');
  readonly filaSeleccionada = output<FilaTabla>();

  readonly pagina = signal(0);
  readonly orden = signal(0);
  readonly direccion = signal<'ascending' | 'descending'>('ascending');
  private readonly tamano = 6;

  readonly filtradas = computed(() => {
    const query = this.valor().trim().toLowerCase();
    const rows = this.filas().filter((fila) => !query || fila.celdas.some((celda) => celda.toLowerCase().includes(query)));
    const index = this.orden();
    const factor = this.direccion() === 'ascending' ? 1 : -1;
    return [...rows].sort((a, b) => (a.celdas[index] ?? '').localeCompare(b.celdas[index] ?? '', 'es') * factor);
  });

  readonly visibles = computed(() => this.filtradas().slice(this.pagina() * this.tamano, (this.pagina() + 1) * this.tamano));
  readonly paginas = computed(() => Math.max(1, Math.ceil(this.filtradas().length / this.tamano)));

  escribir(event: Event): void {
    this.valor.set(event.target instanceof HTMLInputElement ? event.target.value : '');
    this.pagina.set(0);
  }

  ordenar(index: number): void {
    if (this.orden() === index) {
      this.direccion.update((current) => current === 'ascending' ? 'descending' : 'ascending');
    } else {
      this.orden.set(index);
      this.direccion.set('ascending');
    }
    this.pagina.set(0);
  }

  mover(delta: number): void {
    const next = this.pagina() + delta;
    if (next >= 0 && next < this.paginas()) {
      this.pagina.set(next);
    }
  }
}
