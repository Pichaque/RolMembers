import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonAccordion, IonAccordionGroup, IonContent, IonItem, IonLabel } from '@ionic/angular';

/** Manual corto por rol. El texto largo está en docs/MANUAL_USUARIO.md. */
@Component({
  selector: 'app-help',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonAccordion, IonAccordionGroup, IonContent, IonItem, IonLabel],
  template: `
    <ion-content>
      <main class="page-wrap app-page">
        <p class="eyebrow">AYUDA</p>
        <h1>Cómo se usa la mesa</h1>
        <p>El administrador ve el panel. El narrador lleva su comunidad. El roleador juega en ella.</p>
        <ion-accordion-group>
          <ion-accordion value="todos">
            <ion-item slot="header"><ion-label>Cualquier cuenta</ion-label></ion-item>
            <div slot="content" class="ayuda__cuerpo">
              <p>Regístrate con un nombre visible. En la cabecera puedes cambiar el tema (icono de luna, sol o contraste) y el tamaño del texto con los botones + y −.</p>
            </div>
          </ion-accordion>
          <ion-accordion value="roleador">
            <ion-item slot="header"><ion-label>Roleador</ion-label></ion-item>
            <div slot="content" class="ayuda__cuerpo">
              <p>Únete con un código. Crea tu personaje (retrato opcional y rasgos de la raza del narrador). Confirma asistencia y tira dados en el tablón. Si la app avisa de la migración 005, hay que ejecutar ese SQL en Supabase para que las razas se lean bien.</p>
            </div>
          </ion-accordion>
          <ion-accordion value="narrador">
            <ion-item slot="header"><ion-label>Narrador</ion-label></ion-item>
            <div slot="content" class="ayuda__cuerpo">
              <p>Crea la comunidad, define las razas de la mesa (si falta permiso PostgREST, ejecuta <code>005_permiso_razas.sql</code>), publica sesiones y anuncios, aprueba personajes y exporta el informe de tu mesa. Puedes crear tres comunidades si no eres administrador.</p>
            </div>
          </ion-accordion>
          <ion-accordion value="admin">
            <ion-item slot="header"><ion-label>Administrador</ion-label></ion-item>
            <div slot="content" class="ayuda__cuerpo">
              <p>El panel de indicadores y los informes globales son solo tuyos. Un usuario sin ese rol ve la página de sin permiso.</p>
            </div>
          </ion-accordion>
          <ion-accordion value="atajos">
            <ion-item slot="header"><ion-label>Atajos del calendario</ion-label></ion-item>
            <div slot="content" class="ayuda__cuerpo">
              <p>Flechas para mover el día. Inicio y Fin saltan al borde de la semana. AvPág y RePág cambian de mes.</p>
            </div>
          </ion-accordion>
        </ion-accordion-group>
      </main>
    </ion-content>
  `,
  styles: `
    .ayuda__cuerpo { padding: 0 1rem 1rem; }
  `,
})
export class HelpPage {}
