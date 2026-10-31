import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { isDevMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withComponentInputBinding, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
import {
  alertCircleOutline,
  arrowForwardOutline,
  bookOutline,
  calendarOutline,
  chevronForwardOutline,
  compassOutline,
  contrastOutline,
  addOutline,
  removeOutline,
  gameControllerOutline,
  logInOutline,
  logOutOutline,
  mailOutline,
  moonOutline,
  peopleOutline,
  personAddOutline,
  shieldCheckmarkOutline,
  sparklesOutline,
  sunnyOutline,
} from 'ionicons/icons';
import { addIcons } from 'ionicons';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { provideServiceWorker } from '@angular/service-worker';
import { supabaseInterceptor } from './app/core/interceptors/supabase.interceptor';

addIcons({
  alertCircleOutline,
  arrowForwardOutline,
  bookOutline,
  calendarOutline,
  chevronForwardOutline,
  compassOutline,
  contrastOutline,
  addOutline,
  removeOutline,
  gameControllerOutline,
  logInOutline,
  logOutOutline,
  mailOutline,
  moonOutline,
  peopleOutline,
  personAddOutline,
  shieldCheckmarkOutline,
  sparklesOutline,
  sunnyOutline,
});

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideHttpClient(withInterceptors([supabaseInterceptor])),
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
});
