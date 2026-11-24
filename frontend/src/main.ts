/**
 * @file main.ts
 * @description Punto de arranque de la aplicación híbrida Angular Standalone + Capacitor.
 */

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent).catch((err: unknown) => console.error(err));
