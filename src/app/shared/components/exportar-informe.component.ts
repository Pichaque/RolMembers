import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IonButton } from '@ionic/angular';
import { downloadCsv } from '../../core/utils/csv';
import { downloadPdf } from '../../core/utils/pdf';

/**
 * Descarga el informe en CSV o PDF y avisa con `exportado`.
 * No lee de Supabase: las filas llegan por input.
 */
@Component({
  selector: 'app-exportar-informe',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton],
  template: `
    <ion-button fill="outline" class="button-outline" type="button" (click)="descargarCsv()" [disabled]="!filas().length">
      {{ titulo() }} CSV
    </ion-button>
    <ion-button fill="outline" class="button-outline" type="button" (click)="descargarPdf()" [disabled]="!filas().length">
      {{ titulo() }} PDF
    </ion-button>
  `,
  styles: `
    :host { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
  `,
})
/** Descarga CSV o PDF a partir de filas recibidas por input. */
export class ExportarInformeComponent {
  readonly columnas = input.required<string[]>();
  readonly filas = input.required<string[][]>();
  readonly titulo = input('Informe');
  readonly colorMarca = input('#b97650');
  readonly exportado = output<string>();

  /** CSV con separador `;`, BOM y celdas saneadas. */
  descargarCsv(): void {
    const nombre = `${this.archivo()}.csv`;
    downloadCsv(nombre, this.columnas(), this.filas());
    this.exportado.emit(nombre);
  }

  /** PDF con cabecera de color, fecha y número de página. */
  descargarPdf(): void {
    const nombre = `${this.archivo()}.pdf`;
    downloadPdf({
      titulo: this.titulo(),
      color: this.colorMarca(),
      columnas: this.columnas(),
      filas: this.filas(),
    });
    this.exportado.emit(nombre);
  }

  private archivo(): string {
    return this.titulo().toLowerCase().replace(/\s+/g, '-');
  }
}
