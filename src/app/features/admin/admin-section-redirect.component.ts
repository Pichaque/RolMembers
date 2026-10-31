import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/** Redirige rutas antiguas del panel a /admin con query de sección. */
@Component({
  selector: 'app-admin-section-redirect',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class AdminSectionRedirectComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const seccion = this.route.snapshot.data['seccion'];
    const destino = seccion === 'informes' ? 'informes' : 'indicadores';
    void this.router.navigate(['/admin'], { queryParams: { seccion: destino }, replaceUrl: true });
  }
}
