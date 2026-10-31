import { inject, Injectable, signal } from '@angular/core';
import { Session, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
/** Sesión de Supabase Auth. */
export class AuthService {
  readonly user = signal<User | null>(null);
  readonly accessToken = signal<string | null>(null);
  readonly initializationError = signal<string | null>(null);

  private initializationPromise: Promise<boolean> | null = null;
  private authListenerRegistered = false;

  private readonly supabase = inject(SupabaseService);

  initialize(): Promise<boolean> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    if (!this.authListenerRegistered) {
      this.supabase.client.auth.onAuthStateChange((_event, session) => {
        this.applySession(session);
      });
      this.authListenerRegistered = true;
    }

    this.initializationError.set(null);
    this.initializationPromise = this.loadSession();
    return this.initializationPromise;
  }

  async signIn(email: string, password: string): Promise<void> {
    this.logAuthRequest('sign-in', email, password);
    const { data, error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    if (error) {
      this.logAuthResponse('sign-in', error, false, false);
      throw error;
    }
    this.logAuthResponse('sign-in', null, true, Boolean(data.user));

    if (!data.user?.email_confirmed_at) {
      const { error: signOutError } = await this.supabase.client.auth.signOut();
      if (signOutError) {
        throw signOutError;
      }
      this.applySession(null);
      throw new Error('Email not confirmed');
    }

    this.applySession(data.session);
  }

  async signUp(email: string, password: string, displayName: string): Promise<'confirmation-sent' | 'confirmation-disabled'> {
    this.logAuthRequest('sign-up', email, password);
    const { data, error } = await this.supabase.client.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName.trim() } },
    });
    if (error) {
      this.logAuthResponse('sign-up', error, false, false);
      throw error;
    }
    this.logAuthResponse('sign-up', null, Boolean(data.session), Boolean(data.user), Boolean(data.user?.email_confirmed_at));

    if (data.session) {
      const { error: signOutError } = await this.supabase.client.auth.signOut();
      if (signOutError) {
        throw signOutError;
      }
    }
    this.applySession(null);
    return data.user?.email_confirmed_at ? 'confirmation-disabled' : 'confirmation-sent';
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.client.auth.signOut();
    if (error) {
      throw error;
    }
    this.applySession(null);
  }

  private applySession(session: Session | null): void {
    this.user.set(session?.user ?? null);
    this.accessToken.set(session?.access_token ?? null);
  }

  private async loadSession(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.client.auth.getSession();
      if (error) {
        this.initializationError.set('No se pudo recuperar la sesión. Comprueba tu conexión e inténtalo de nuevo.');
        this.initializationPromise = null;
        return false;
      }
      this.applySession(data.session);
      this.initializationError.set(null);
      return true;
    } catch {
      this.initializationError.set('No se pudo conectar con el servicio de autenticación. Comprueba tu conexión.');
      this.initializationPromise = null;
      return false;
    }
  }

  private logAuthRequest(operation: 'sign-up' | 'sign-in', email: string, password: string): void {
    if (environment.production) {
      return;
    }

    console.debug('[auth] request', {
      operation,
      endpoint: new URL(environment.supabaseUrl).host,
      payloadFields: ['email', 'password'],
      emailPresent: email.length > 0,
      emailLength: email.length,
      passwordPresent: password.length > 0,
    });
  }

  private logAuthResponse(
    operation: 'sign-up' | 'sign-in',
    error: unknown,
    sessionReturned: boolean,
    userReturned: boolean,
    emailConfirmed?: boolean,
  ): void {
    if (environment.production) {
      return;
    }

    const errorDetails = this.getSafeErrorDetails(error);
    console.debug('[auth] response', {
      operation,
      successful: error === null,
      httpStatus: errorDetails.status,
      errorCode: errorDetails.code,
      sessionReturned,
      userReturned,
      emailConfirmed: emailConfirmed ?? null,
    });
  }

  private getSafeErrorDetails(error: unknown): { status: number | null; code: string | null } {
    if (typeof error !== 'object' || error === null) {
      return { status: null, code: null };
    }

    const details = error as { status?: unknown; code?: unknown };
    return {
      status: typeof details.status === 'number' ? details.status : null,
      code: typeof details.code === 'string' ? details.code : null,
    };
  }
}
