import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { Permiso } from '../../core/permissions/permissions';
import { CommunityStore } from '../../core/stores/community.store';

/**
 * Muestra el contenido solo si el rol activo tiene el permiso.
 * Uso: `*appPuede="'crear-evento'"`. El prefijo `app` lo exige el linter.
 */
@Directive({
  selector: '[appPuede]',
  standalone: true,
})
export class PuedeDirective {
  readonly appPuede = input.required<Permiso>();
  readonly appPuedeCreador = input(false);

  private readonly template = inject(TemplateRef<unknown>);
  private readonly view = inject(ViewContainerRef);
  private readonly community = inject(CommunityStore);
  private visible = false;

  constructor() {
    effect(() => {
      const allowed = this.community.can(this.appPuede(), this.appPuedeCreador());
      if (allowed && !this.visible) {
        this.view.createEmbeddedView(this.template);
        this.visible = true;
      } else if (!allowed && this.visible) {
        this.view.clear();
        this.visible = false;
      }
    });
  }
}
