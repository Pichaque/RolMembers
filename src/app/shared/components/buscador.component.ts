import { ChangeDetectionStrategy, Component, model } from '@angular/core';

/** Campo de búsqueda con doble enlace `[(valor)]`. */
@Component({
  selector: 'app-buscador',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="buscador">
      Buscar
      <input [value]="valor()" (input)="onInput($event)" type="search" />
    </label>
  `,
  styles: `
    .buscador { display: grid; gap: 0.4rem; margin: 0.75rem 0; color: var(--color-on-panel); }
    input { min-height: 2.75rem; padding: 0 0.8rem; border: 1px solid var(--color-border); border-radius: 0.6rem; color: var(--color-on-panel); background: var(--field-bg); }
  `,
})
/** Campo de búsqueda con model(). */
export class BuscadorComponent {
  /** Texto que el padre lee y escribe. */
  readonly valor = model('');

  onInput(event: Event): void {
    this.valor.set(event.target instanceof HTMLInputElement ? event.target.value : '');
  }
}
