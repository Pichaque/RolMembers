import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** Datos que la ficha muestra. La página decide los permisos. */
export interface PersonajeVista {
  id: string;
  nombre: string;
  estado: string;
  profesion?: string;
  rasgos?: string[];
  retratoUrl?: string | null;
}

/** Ficha de personaje sin acceso a datos. */
@Component({
  selector: 'app-ficha-personaje',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="ficha">
      @if (personaje().retratoUrl) {
        <img class="ficha__retrato" [src]="personaje().retratoUrl" [alt]="'Retrato de ' + personaje().nombre" width="120" height="120" />
      }
      <h3>{{ personaje().nombre }}</h3>
      <p class="ficha__estado">{{ personaje().estado }}</p>
      @if (personaje().profesion) {
        <p class="ficha__meta"><strong>Profesión:</strong> {{ personaje().profesion }}</p>
      }
      @if (personaje().rasgos?.length) {
        <p class="ficha__meta"><strong>Rasgos:</strong> {{ personaje().rasgos?.join(', ') }}</p>
      }
      <div class="ficha__acciones">
        @if (puedeAprobar()) {
          <button type="button" (click)="aprobar.emit(personaje().id)">Aprobar</button>
          <button type="button" (click)="rechazar.emit(personaje().id)">Rechazar</button>
        }
        @if (puedeEditar()) {
          <button type="button" (click)="editar.emit(personaje().id)">Editar</button>
        }
        @if (puedeEliminar()) {
          <button type="button" (click)="eliminar.emit(personaje().id)">Eliminar</button>
        }
      </div>
    </article>
  `,
  styles: `
    .ficha { display: grid; gap: 0.4rem; padding: 0.8rem; border: 1px solid var(--color-border); border-radius: 1rem; background: var(--color-panel, transparent); color: var(--color-on-panel, inherit); }
    .ficha__retrato { width: 7.5rem; height: 7.5rem; object-fit: cover; border-radius: 0.75rem; border: 1px solid var(--color-border); }
    .ficha__estado { margin: 0; font-weight: 600; }
    .ficha__meta { margin: 0; font-size: 0.9rem; overflow-wrap: anywhere; }
    .ficha__acciones { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.65rem; }
    .ficha__acciones button { min-height: 2.75rem; padding: 0.4rem 0.95rem; border: 1px solid var(--color-border); border-radius: 999px; background: transparent; color: var(--color-copper); font: inherit; font-weight: 600; cursor: pointer; }
    .ficha__acciones button:hover { background: color-mix(in srgb, var(--color-copper) 16%, transparent); }
  `,
})
/** Ficha de personaje. Las acciones salen por output. */
export class FichaPersonajeComponent {
  readonly personaje = input.required<PersonajeVista>();
  readonly puedeAprobar = input(false);
  readonly puedeEditar = input(false);
  readonly puedeEliminar = input(false);
  readonly aprobar = output<string>();
  readonly rechazar = output<string>();
  readonly editar = output<string>();
  readonly eliminar = output<string>();
}
