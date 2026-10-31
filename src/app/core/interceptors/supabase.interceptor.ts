import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

/** Añade credenciales de Supabase y traduce fallos HTTP a un aviso. */
export const supabaseInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(environment.supabaseUrl)) {
    return next(request);
  }

  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastController);
  const token = auth.accessToken() ?? environment.supabaseKey;
  const secured = request.clone({
    setHeaders: {
      apikey: environment.supabaseKey,
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  return next(secured).pipe(
    catchError((error: unknown) => {
      const status = error instanceof HttpErrorResponse ? error.status : 0;
      if (status === 401) {
        void auth.signOut().finally(() => router.navigateByUrl('/login'));
        void present(toast, 'La sesión ha caducado. Vuelve a entrar.');
      } else {
        void present(toast, 'No se pudo completar la consulta. Revisa la conexión.');
      }
      return throwError(() => error);
    }),
  );
};

async function present(toast: ToastController, message: string): Promise<void> {
  const overlay = await toast.create({ message, duration: 3200, position: 'bottom', color: 'dark' });
  await overlay.present();
}
