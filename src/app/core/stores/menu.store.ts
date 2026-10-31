import { Injectable, signal } from '@angular/core';

/** Estado del menú lateral para etiquetas accesibles en la cabecera. */
@Injectable({ providedIn: 'root' })
export class MenuStore {
  readonly open = signal(false);

  /** Persiste preferencia opcional al abrir o cerrar. */
  persist(open: boolean): void {
    this.open.set(open);
    globalThis.localStorage?.setItem('app-menu-open', open ? '1' : '0');
  }
}
