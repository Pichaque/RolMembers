import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommunityStore } from '../stores/community.store';
import { SessionStore } from '../stores/session.store';
import { adminGuard, serverMemberGuard } from './role.guard';
import { authGuard } from './auth.guard';

describe('guards', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { initialize: async () => true, user: () => null } },
        { provide: SessionStore, useValue: { ensure: async () => undefined, isAdmin: () => false } },
        {
          provide: CommunityStore,
          useValue: { ensureLoaded: async () => undefined, memberships: () => [], can: () => false },
        },
      ],
    });
  });

  it('manda al login si no hay sesión y a forbidden si no es administrador', async () => {
    const router = TestBed.inject(Router);
    const login = await TestBed.runInInjectionContext(() => authGuard({} as never, { url: '/dashboard' } as never));
    const forbidden = await TestBed.runInInjectionContext(() => adminGuard({} as never, { url: '/admin' } as never));
    expect(router.serializeUrl(login as UrlTree)).toBe('/login?returnUrl=%2Fdashboard');
    expect(router.serializeUrl(forbidden as UrlTree)).toBe('/forbidden');
  });

  it('deja pasar al administrador', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { initialize: async () => true, user: () => ({ id: 'admin' }) } },
        { provide: SessionStore, useValue: { ensure: async () => undefined, isAdmin: () => true } },
        { provide: CommunityStore, useValue: { ensureLoaded: async () => undefined, memberships: () => [], can: () => true } },
      ],
    });
    const allowed = await TestBed.runInInjectionContext(() => adminGuard({} as never, { url: '/admin' } as never));
    expect(allowed).toBe(true);
  });

  it('niega una comunidad ajena', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { initialize: async () => true, user: () => ({ id: 'u1' }) } },
        { provide: SessionStore, useValue: { ensure: async () => undefined, isAdmin: () => false } },
        { provide: CommunityStore, useValue: { ensureLoaded: async () => undefined, memberships: () => [], can: () => false } },
      ],
    });
    const router = TestBed.inject(Router);
    const denied = await TestBed.runInInjectionContext(() => serverMemberGuard(
      { paramMap: { get: () => 'srv' } } as never,
      { url: '/servers/srv' } as never,
    ));
    expect(router.serializeUrl(denied as UrlTree)).toBe('/forbidden');
  });
});
