import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Indicador numérico. El valor lo calcula la página. */
@Component({
  selector: 'app-widget-estadistica',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="widget">
      <p>{{ titulo() }}</p>
      @if (cargando()) {
        <p>Cargando…</p>
      } @else {
        <strong>{{ valor() }}</strong>
        @if (variacion()) { <span>{{ variacion() }}</span> }
      }
    </article>
  `,
  styles: `
    .widget { padding: 1rem; border: 1px solid var(--color-border); border-radius: 1rem; background: var(--color-panel); color: var(--color-on-panel); }
    strong { display: block; font-size: 2rem; }
  `,
})
/** Indicador con título, valor y estado de carga. */
export class WidgetEstadisticaComponent {
  readonly titulo = input.required<string>();
  readonly valor = input.required<string | number>();
  readonly variacion = input('');
  readonly icono = input('');
  readonly cargando = input(false);
}
