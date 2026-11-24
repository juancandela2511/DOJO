/**
 * @file app.component.ts
 * @description Componente Raíz del Sistema de Gestión de Dojo.
 *              Mantiene en todo momento (tanto en el inicio como dentro de los paneles
 *              después de iniciar sesión) el ambiente nocturno "Moonlit Lotus & Sakura Petals"
 *              con tarjetas de cristal translúcido limpias y bien estructuradas.
 */

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthSessionService } from './core/services/auth-session.service';
import { DojoApiService } from './core/services/dojo-api.service';
import { AdminDashboardComponent } from './features/admin/admin-dashboard.component';
import { AssistantClassLogComponent } from './features/assistant/assistant-class-log.component';
import { StudentMobileHomeComponent } from './features/student/student-mobile-home.component';
import { LoginModeTab, LoginPortalComponent } from './features/auth/login-portal.component';
import { MoonlitPetalsComponent } from './shared/moonlit-petals.component';
import { UserRole } from './core/models/dojo.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    LoginPortalComponent,
    MoonlitPetalsComponent,
    AdminDashboardComponent,
    AssistantClassLogComponent,
    StudentMobileHomeComponent,
  ],
  template: `
    <!-- FONDO GLOBAL PERSISTENTE: LUNA Y PÉTALOS DE LOTO/CEREZO EN TODA LA APP -->
    <div class="fixed inset-0 z-0 bg-[#070a14]">
      <app-moonlit-petals></app-moonlit-petals>
    </div>

    <!-- 1. BARRA DE NAVEGACIÓN SUPERIOR MOONLIT LOTUS GLASS -->
    <header class="sticky top-0 z-40 px-4 sm:px-6 h-16 flex items-center bg-[#070a14]/78 backdrop-blur-xl border-b border-pink-200/15 text-white">
      <div class="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="inline-flex items-center justify-center w-9 h-9 rounded-xl text-base bg-pink-300/15 border border-pink-200/30 text-pink-200 shadow-[0_0_18px_rgba(248,187,208,0.2)]">
            🌸
          </span>
          <span class="text-[17px] font-semibold tracking-tight text-white">
           Kung Fu Dojo
          </span>

          @if (authSession.isAuthenticated()) {
            <span class="hidden md:inline-block text-white/20">|</span>
            <div class="hidden md:flex items-center gap-2 text-[13px]">
              <span class="font-semibold text-pink-100">{{ authSession.currentUser().fullName }}</span>
              <span class="px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-blue-200/80 text-[11px]">
                CC {{ authSession.currentUser().documentNumber }}
              </span>
            </div>
          }
        </div>

        <!-- Controles de Acceso / Sesión -->
        <div class="flex items-center gap-2 sm:gap-3">
          @if (authSession.isAuthenticated()) {
            <!-- Cambio entre Mi Mensualidad y Dar Clase si el usuario tiene permiso delegado -->
            @if (authSession.currentUser().role !== 'ADMIN' && authSession.currentUserCanManageClass()) {
              <div class="inline-flex p-1 rounded-full bg-[#050914]/80 border border-pink-200/20">
                <button
                  type="button"
                  (click)="authSession.setWorkspaceView('ESTUDIANTE')"
                  [class]="
                    authSession.activeWorkspaceView() === 'ESTUDIANTE'
                      ? 'px-3.5 py-1 rounded-full bg-gradient-to-r from-pink-200 to-indigo-200 text-[#090d1a] text-[12px] font-semibold shadow-sm transition'
                      : 'px-3.5 py-1 rounded-full text-blue-100/75 hover:text-white text-[12px] font-medium transition'
                  "
                >
                  👤 Mi Mensualidad
                </button>
                <button
                  type="button"
                  (click)="authSession.setWorkspaceView('AYUDANTE')"
                  [class]="
                    authSession.activeWorkspaceView() === 'AYUDANTE'
                      ? 'px-3.5 py-1 rounded-full bg-gradient-to-r from-pink-200 to-indigo-200 text-[#090d1a] text-[12px] font-semibold shadow-sm transition'
                      : 'px-3.5 py-1 rounded-full text-blue-100/75 hover:text-white text-[12px] font-medium transition'
                  "
                >
                  🥋 Dar Clase
                </button>
              </div>
            }

            <button
              type="button"
              (click)="openLoginModal()"
              class="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-blue-100 hover:text-white text-[12px] font-semibold border border-white/15 transition"
            >
              Cambiar Cuenta
            </button>

            <button
              type="button"
              (click)="authSession.logout()"
              class="px-4 py-1.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 border border-rose-300/30 text-[12px] font-semibold transition"
            >
              Salir
            </button>
          } @else {
            <button
              type="button"
              (click)="openLoginModal('ESTUDIANTE')"
              class="lotus-primary-pill px-5 py-1.5 text-[13px]"
            >
              Iniciar Sesión
            </button>
          }
        </div>
      </div>
    </header>

    <!-- 2. PÁGINA INICIAL INMERSIVA -->
    @if (!authSession.isAuthenticated()) {
      <div class="relative z-10 min-h-[calc(100vh-64px)] text-white flex flex-col justify-between">
        <div class="pointer-events-none max-w-7xl w-full mx-auto px-6 pt-16 pb-16 flex-1 flex flex-col justify-between gap-14">
          <div class="max-w-3xl pt-4">
            <span
              class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-pink-200 text-[12px] font-semibold mb-5"
              style="
                background: rgba(248, 187, 208, 0.12);
                border: 1px solid rgba(251, 208, 224, 0.26);
                backdrop-filter: blur(12px);
              "
            >
              🌸 Templo · Entrenamiento, Asistencia y Mensualidades
            </span>

            <h1 class="apple-hero-headline text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
              Cae siete veces, levántate ocho.
            </h1>

            <p class="text-blue-100/80 text-[17px] mt-4 max-w-xl leading-relaxed">
              Consulta tu mensualidad con tu cédula, registra la asistencia y técnicas de clase o administra el Dojo bajo una experiencia serena y limpia.
            </p>

            <div class="mt-8 pointer-events-auto inline-flex flex-wrap items-center gap-4 p-2 pl-5 rounded-full bg-[#0d152a]/75 backdrop-blur-xl border border-pink-200/20 shadow-[0_14px_40px_rgba(3,6,15,0.65)]">
              <span class="text-[14px] font-medium text-blue-100/90">
                En el tatami hoy: <strong class="text-pink-200">{{ getInClassCount() }} discípulos</strong>
              </span>
              <button
                type="button"
                (click)="openLoginModal('ESTUDIANTE')"
                class="lotus-primary-pill px-6 py-2.5 text-[14px]"
              >
                Iniciar Sesión →
              </button>
            </div>
          </div>

          <!-- Tarjetas de Acceso en Cristal Nocturno -->
          <div class="pointer-events-auto space-y-5">
            <div>
              <h2 class="text-[22px] font-semibold tracking-tight text-white">
                Acceso diseñado para cada miembro del Dojo
              </h2>
              <p class="text-[14px] text-blue-200/70">
                Haz clic en cualquiera de los accesos o en <strong>Iniciar Sesión</strong> para abrir el portal sobre el mar nocturno.
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div
                (click)="openLoginModal('ESTUDIANTE')"
                class="group lotus-glass-card p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-pink-300/40"
              >
                <span class="inline-block px-3 py-0.5 rounded-full bg-pink-300/15 border border-pink-300/30 text-pink-200 text-[11px] font-semibold mb-3">
                  Solo Cédula
                </span>
                <h3 class="text-[19px] font-semibold text-white group-hover:text-pink-200 transition mb-2">
                  👤 Estudiantes
                </h3>
                <p class="text-[13.5px] text-blue-100/70 leading-relaxed">
                  Ingresa únicamente tu número de cédula para ver tus datos personales, semáforo de mensualidad, grado e historial de clases.
                </p>
              </div>

              <div
                (click)="openLoginModal('ESTUDIANTE')"
                class="group lotus-glass-card p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-pink-300/40"
              >
                <span class="inline-block px-3 py-0.5 rounded-full bg-purple-300/15 border border-purple-300/30 text-purple-200 text-[11px] font-semibold mb-3">
                  Dentro de tu Cuenta de Usuario
                </span>
                <h3 class="text-[19px] font-semibold text-white group-hover:text-pink-200 transition mb-2">
                  🥋 Dar la Clase (Permiso Delegado)
                </h3>
                <p class="text-[13.5px] text-blue-100/70 leading-relaxed">
                  Si el Admin te delega permiso para dar la clase, ingresas como usuario normal con tu cédula y podrás editar quién vino y qué hizo cada asistente.
                </p>
              </div>

              <div
                (click)="openLoginModal('ADMIN')"
                class="group lotus-glass-card p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-pink-300/40"
              >
                <span class="inline-block px-3 py-0.5 rounded-full bg-blue-300/15 border border-blue-300/30 text-blue-200 text-[11px] font-semibold mb-3">
                  Cédula + Contraseña
                </span>
                <h3 class="text-[19px] font-semibold text-white group-hover:text-pink-200 transition mb-2">
                  🔐 Administración
                </h3>
                <p class="text-[13.5px] text-blue-100/70 leading-relaxed">
                  Control total de mensualidades, registro OCR de nuevos alumnos, ascensos de cinturón y delegación de permisos de clase.
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer class="border-t border-white/10 bg-[#050811]/60 backdrop-blur-md text-blue-200/60 text-[12px] px-6 py-4">
          <div class="max-w-7xl mx-auto flex flex-wrap justify-between gap-2">
            <span>© 2026 Kung Fu Dojo</span>
            <span class="text-pink-200/80 font-medium">Moonlit Lotus & Ocean Edition</span>
          </div>
        </footer>
      </div>
    } @else {
      <!-- 3. PANEL OPERATIVO AUTENTICADO CON AMBIENTE MOONLIT LOTUS -->
      <main class="relative z-10 min-h-[calc(100vh-64px)] pb-16">
        @switch (authSession.activeWorkspaceView()) {
          @case ('ADMIN') {
            <app-admin-dashboard></app-admin-dashboard>
          }
          @case ('AYUDANTE') {
            <app-assistant-class-log></app-assistant-class-log>
          }
          @case ('ESTUDIANTE') {
            <app-student-mobile-home></app-student-mobile-home>
          }
        }
      </main>
    }

    <!-- 4. MODAL ANIMADO DE LOGIN -->
    @if (showLoginModal()) {
      <app-login-portal
        [initialTab]="selectedLoginTab()"
        (closed)="showLoginModal.set(false)"
      ></app-login-portal>
    }
  `,
})
export class AppComponent {
  public readonly authSession = inject(AuthSessionService);
  public readonly dojoApi = inject(DojoApiService);

  public readonly showLoginModal = signal<boolean>(false);
  public readonly selectedLoginTab = signal<LoginModeTab>('ESTUDIANTE');

  public openLoginModal(tab: LoginModeTab = 'ESTUDIANTE'): void {
    this.selectedLoginTab.set(tab);
    this.showLoginModal.set(true);
  }

  public switchRole(role: UserRole): void {
    this.authSession.switchActiveRole(role);
  }

  public getInClassCount(): number {
    return this.dojoApi.students().filter((s) => s.isCurrentlyInClass).length;
  }
}
