import { ChangeDetectionStrategy, Component, inject, Input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonSpinner } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { passwordsMatch } from '../../shared/validators/async-validators';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-auth',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth.page.html',
  imports: [IonButton, IonContent, IonIcon, IonSpinner, ReactiveFormsModule, RouterLink],
})
/** Inicio de sesión y registro. */
export class AuthPage implements OnInit {
  @Input() mode: AuthMode = 'login';

  readonly loading = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  private readonly formBuilder = inject(FormBuilder);
  readonly form = this.formBuilder.nonNullable.group({
    displayName: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    confirmPassword: [''],
  }, { validators: passwordsMatch });

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (this.isRegister) {
      this.form.controls.displayName.addValidators([Validators.required, Validators.minLength(2)]);
      this.form.controls.confirmPassword.addValidators(Validators.required);
      this.form.controls.displayName.updateValueAndValidity();
      this.form.controls.confirmPassword.updateValueAndValidity();
    }
  }

  get isRegister(): boolean {
    return this.mode === 'register';
  }

  async submit(): Promise<void> {
    this.error.set('');
    this.notice.set('');
    this.form.markAllAsTouched();
    if (this.form.invalid || this.form.pending || this.loading()) {
      return;
    }

    this.loading.set(true);
    const { email, password, displayName } = this.form.getRawValue();
    try {
      if (this.isRegister) {
        const result = await this.auth.signUp(email.trim(), password, displayName);
        if (result === 'confirmation-sent') {
          this.notice.set('Revisa tu correo y confirma la cuenta desde el enlace que te hemos enviado. Después podrás iniciar sesión.');
        } else {
          this.error.set('La confirmación por correo está desactivada en Supabase. Actívala en Authentication > Sign In / Providers > Email para impedir el acceso hasta verificar el correo.');
        }
      } else {
        await this.auth.signIn(email.trim(), password);
        await this.router.navigateByUrl(this.getReturnUrl());
      }
    } catch (error: unknown) {
      this.error.set(this.getErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  private getReturnUrl(): string {
    const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
    return returnUrl?.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/dashboard';
  }

  private getErrorMessage(error: unknown): string {
    const message = error instanceof Error ? error.message.toLowerCase() : '';

    if (message.includes('invalid login credentials')) {
      return 'El correo o la contraseña no son correctos.';
    }
    if (message.includes('email not confirmed')) {
      return 'Confirma tu correo electrónico antes de iniciar sesión.';
    }
    if (message.includes('user already registered')) {
      return 'Ya existe una cuenta con ese correo. Prueba a iniciar sesión.';
    }
    if (message.includes('password should be at least')) {
      return 'La contraseña no cumple los requisitos de seguridad.';
    }
    if (message.includes('rate limit')) {
      return 'Se han realizado demasiados intentos. Espera un momento y vuelve a probar.';
    }
    return 'No se pudo completar la solicitud. Comprueba los datos y vuelve a intentarlo.';
  }
}
