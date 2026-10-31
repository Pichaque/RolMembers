import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { IonButton } from '@ionic/angular';

/** Tirada que el componente calcula y la página guarda. */
export interface Tirada {
  sides: number;
  result: number;
  label: string;
}

/** Dado de 4 a 100 caras. El azar sale de `crypto.getRandomValues`. */
@Component({
  selector: 'app-tirador-dados',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton],
  templateUrl: './tirador-dados.component.html',
  styleUrl: './tirador-dados.component.scss',
})
/** Tira un dado con crypto.getRandomValues. */
export class TiradorDadosComponent {
  readonly opciones = [4, 6, 8, 10, 12, 20, 100];
  readonly caras = signal(20);
  readonly etiqueta = signal('');
  readonly anuncio = signal('Todavía no hay tirada.');
  readonly girando = signal(false);
  readonly resultado = signal<number | null>(null);
  readonly tirada = output<Tirada>();
  readonly historial = input<Tirada[]>([]);

  elegirCaras(opcion: number): void {
    if (this.opciones.includes(opcion)) {
      this.caras.set(opcion);
    }
  }

  etiquetar(event: Event): void {
    this.etiqueta.set(event.target instanceof HTMLInputElement ? event.target.value : '');
  }

  /** Entero uniforme entre 1 y el número de caras. */
  lanzar(): void {
    if (this.girando()) {
      return;
    }
    const sides = this.caras();
    const label = this.etiqueta().trim();
    const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    const result = (buffer[0] % sides) + 1;

    const finalizar = (): void => {
      this.girando.set(false);
      this.resultado.set(result);
      this.anuncio.set(label ? `${label}: ${result} (d${sides})` : `Resultado ${result} en un d${sides}.`);
      this.tirada.emit({ sides, result, label });
    };

    if (reduced) {
      finalizar();
      return;
    }

    this.girando.set(true);
    globalThis.setTimeout(() => finalizar(), 520);
  }
}
