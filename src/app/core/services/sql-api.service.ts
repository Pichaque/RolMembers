import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Lecturas SQL contra PostgREST (`/rest/v1`).
 * El interceptor añade la clave y el token. El resto de escrituras sigue en supabase-js.
 */
@Injectable({ providedIn: 'root' })
export class SqlApiService {
  private readonly http = inject(HttpClient);

  /**
   * GET de una tabla o vista con la query de PostgREST ya montada.
   * @param resource Por ejemplo `servers?select=id,name`.
   */
  get<T>(resource: string): Observable<T> {
    return this.http.get<T>(`${environment.supabaseUrl}/rest/v1/${resource}`);
  }
}
