/**
 * @file login-portal.component.ts
 * @description Modal animado de inicio de sesión con estética "Moonlit Sakura & Ocean Glass".
 *              El cuadro de login utiliza cristal nocturno translúcido (#0a1224/75), bordes
 *              iluminados en rosa sakura y plata lunar, integrándose orgánicamente con el
 *              mar nocturno 3D y los pétalos de cerezo que caen de fondo.
 */

import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { DojoApiService } from '../../core/services/dojo-api.service';
import { OceanSwellComponent } from '../../shared/ocean-swell.component';

export type LoginModeTab = 'ESTUDIANTE' | 'ADMIN';

@Component({
  selector: 'app-login-portal',
  standalone: true,
  imports: [CommonModule, FormsModule, OceanSwellComponent],
  template: `
    <!-- Overlay con entrada y salida gradual sobre el mar nocturno y pétalos de cerezo -->
    <div
      class="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto"
      [ngClass]="isClosing() ? 'animate-dojo-backdrop-exit' : 'animate-dojo-backdrop'"
      (click)="onBackdropClick($event)"
    >
      <!-- Fondo WebGL interactivo (Mar 3D bajo la luna + Pétalos de cerezo cayendo) -->
      <app-ocean-swell></app-ocean-swell>

      <!-- Cuadro de Login con estética Moonlit Sakura Glassmorphism -->
      <div
        class="relative z-10 w-full max-w-md rounded-[28px] p-6 sm:p-8 my-auto overflow-hidden"
        style="
          background: linear-gradient(145deg, rgba(13, 21, 42, 0.78) 0%, rgba(8, 13, 26, 0.86) 100%);
          backdrop-filter: blur(22px) saturate(160%);
          border: 1px solid rgba(251, 208, 224, 0.22);
          box-shadow: 0 28px 80px rgba(3, 6, 15, 0.85), 0 0 45px rgba(248, 187, 208, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.15);
        "
        [ngClass]="isClosing() ? 'animate-dojo-modal-exit' : 'animate-dojo-modal'"
        (click)="$event.stopPropagation()"
      >
        <!-- Brillo superior sutil en tono rosa cerezo y luz lunar -->
        <div
          class="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-36 rounded-full pointer-events-none"
          style="background: radial-gradient(circle, rgba(248, 187, 208, 0.22) 0%, rgba(147, 197, 253, 0.08) 55%, transparent 75%); filter: blur(18px);"
        ></div>

        <!-- Botón Cerrar -->
        <button
          type="button"
          (click)="closeWithAnimation()"
          aria-label="Cerrar ventana de inicio de sesión"
          class="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-pink-200/20 text-blue-100/80 hover:text-white border border-white/10 flex items-center justify-center text-[14px] font-semibold transition"
        >
          ✕
        </button>

        <!-- Encabezado Acorde a los Pétalos y la Luna -->
        <div class="relative text-center mb-6">
          <div
            class="inline-flex items-center justify-center w-12 h-12 rounded-2xl text-xl mb-3"
            style="
              background: linear-gradient(135deg, rgba(248, 187, 208, 0.22) 0%, rgba(147, 197, 253, 0.18) 100%);
              border: 1px solid rgba(251, 208, 224, 0.35);
              box-shadow: 0 0 24px rgba(248, 187, 208, 0.18);
            "
          >
            🌸
          </div>
          <h2 class="text-[24px] font-semibold tracking-tight text-white">
            Iniciar Sesión
          </h2>
       
        </div>

        <!-- Selector Segmentado de Solo 2 Modos: Usuario o Administrador -->
        <div class="grid grid-cols-2 gap-1.5 p-1.5 rounded-[14px] mb-6 bg-[#060a14]/75 border border-white/10">
          <button
            type="button"
            (click)="selectTab('ESTUDIANTE')"
            [class]="
              activeTab() === 'ESTUDIANTE'
                ? 'py-2.5 px-3 rounded-[10px] bg-gradient-to-r from-[#1e2d4f] to-[#2d2346] text-pink-100 border border-pink-300/30 font-semibold text-[13px] shadow-md transition-all duration-200'
                : 'py-2.5 px-3 rounded-[10px] text-blue-200/65 hover:text-white font-medium text-[13px] transition-all duration-200'
            "
          >
            👤 Usuario
          </button>
          <button
            type="button"
            (click)="selectTab('ADMIN')"
            [class]="
              activeTab() === 'ADMIN'
                ? 'py-2.5 px-3 rounded-[10px] bg-gradient-to-r from-[#1e2d4f] to-[#2d2346] text-pink-100 border border-pink-300/30 font-semibold text-[13px] shadow-md transition-all duration-200'
                : 'py-2.5 px-3 rounded-[10px] text-blue-200/65 hover:text-white font-medium text-[13px] transition-all duration-200'
            "
          >
            🔐 Administrador
          </button>
        </div>

        <!-- MODO 1: USUARIO (SOLO CÉDULA) -->
        @if (activeTab() === 'ESTUDIANTE') {
          <div class="animate-dojo-tab">
            <div class="mb-4">
              <span class="inline-block px-2.5 py-0.5 rounded-full bg-pink-300/15 border border-pink-300/30 text-pink-200 text-[11px] font-semibold mb-1.5">
                Ingreso con Solo Cédula
              </span>
              

            </div>

            <form (ngSubmit)="onStudentSubmit()" class="space-y-4">
              <div>
                <label class="block text-[12px] font-semibold text-pink-100/90 mb-1.5">
              
                </label>
                <input
                  type="text"
                  name="studentCedula"
                  [(ngModel)]="studentCedula"
                  required
                  autocomplete="off"
                  placeholder="Ej. 1020304050"
                  class="w-full px-4 py-3 rounded-[12px] bg-[#050913]/75 border border-white/15 text-white placeholder-blue-200/35 text-[15px] focus:outline-none focus:border-pink-300/60 transition"
                />
              </div>

              <button
                type="submit"
                class="w-full py-3 px-5 rounded-full text-[15px] font-semibold text-[#090d1a] text-center transition hover:opacity-95"
                style="
                  background: linear-gradient(135deg, #fbd0e0 0%, #c4b5fd 52%, #93c5fd 100%);
                  box-shadow: 0 8px 25px rgba(248, 187, 208, 0.28);
                "
              >
                Ingresar con mi Cédula
              </button>
            </form>

            <!-- Accesos rápidos de prueba -->
            <div class="mt-5 pt-4 border-t border-white/10">
              <p class="text-[11px] font-semibold text-blue-200/60 uppercase tracking-wider mb-2">
                Usuarios registrados (Clic para probar):
              </p>
              <div class="space-y-1.5">
                @for (s of dojoApi.students(); track s.id) {
                  <button
                    type="button"
                    (click)="quickStudentLogin(s.documentNumber)"
                    class="w-full text-left px-3 py-2 rounded-[10px] bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-[12px] transition"
                  >
                    <div>
                      <span class="font-semibold text-white">{{ s.firstName }} {{ s.lastName }}</span>
                      <span class="text-blue-200/60 ml-1">· CC {{ s.documentNumber }}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      @if (s.hasDelegatedClassPermission) {
                        <span class="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-[10px] font-semibold">
                          🥋 Da Clase
                        </span>
                      }
                      <span
                        class="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        [ngClass]="{
                          'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30': s.trafficLight === 'VERDE',
                          'bg-amber-400/20 text-amber-200 border border-amber-400/30': s.trafficLight === 'AMARILLO',
                          'bg-rose-400/20 text-rose-200 border border-rose-400/30': s.trafficLight === 'ROJO'
                        }"
                      >
                        {{ s.trafficLight }}
                      </span>
                    </div>
                  </button>
                }
              </div>
            </div>
          </div>
        }

        <!-- MODO 2: ADMINISTRADOR (CÉDULA COMO USUARIO + CONTRASEÑA) -->
        @if (activeTab() === 'ADMIN') {
          <div class="animate-dojo-tab">
            <div class="mb-4">
            
              <h3 class="text-[18px] font-semibold text-white">
                Acceso Administrador
              </h3>
              <p class="text-[13px] text-blue-100/70 mt-0.5">
                Ingresa tu cédula como usuario y tu contraseña para administrar mensualidades y delegar quién puede dar la clase.
              </p>
            </div>

            <form (ngSubmit)="onAdminSubmit()" class="space-y-3.5">
              <div>
                <label class="block text-[12px] font-semibold text-pink-100/90 mb-1">
                  Cédula de Administrador (Usuario)
                </label>
                <input
                  type="text"
                  name="adminCedula"
                  [(ngModel)]="adminCedula"
                  required
                  autocomplete="username"
                  placeholder="Ej. 1000100100"
                  class="w-full px-4 py-2.5 rounded-[12px] bg-[#050913]/75 border border-white/15 text-white placeholder-blue-200/35 text-[15px] focus:outline-none focus:border-pink-300/60 transition"
                />
              </div>

              <div>
                <label class="block text-[12px] font-semibold text-pink-100/90 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  name="adminPassword"
                  [(ngModel)]="adminPassword"
                  required
                  autocomplete="current-password"
                  placeholder="Ingresa tu contraseña"
                  class="w-full px-4 py-2.5 rounded-[12px] bg-[#050913]/75 border border-white/15 text-white placeholder-blue-200/35 text-[15px] focus:outline-none focus:border-pink-300/60 transition"
                />
              </div>

              <button
                type="submit"
                class="w-full py-3 px-5 rounded-full text-[15px] font-semibold text-[#090d1a] text-center transition hover:opacity-95"
                style="
                  background: linear-gradient(135deg, #fbd0e0 0%, #c4b5fd 52%, #93c5fd 100%);
                  box-shadow: 0 8px 25px rgba(248, 187, 208, 0.28);
                "
              >
                Iniciar Sesión como Administrador
              </button>
            </form>

            <div class="mt-5 pt-4 border-t border-white/10">
              <button
                type="button"
                (click)="quickAdminLogin()"
                class="w-full text-left px-3.5 py-2.5 rounded-[10px] bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-[12px] transition"
              >
                <div>
                  <span class="font-semibold text-white">Shifu Administrador</span>
                  <span class="text-blue-200/60 block text-[11px]">CC: 1000100100 · Clave: AdminDojo2026!</span>
                </div>
                <span class="text-pink-200 font-semibold">Entrar →</span>
              </button>
            </div>
          </div>
        }

        @if (errorMessage()) {
          <div class="mt-4 p-3 rounded-[12px] bg-rose-500/20 border border-rose-400/40 text-rose-100 text-[13px] font-medium animate-dojo-tab">
            {{ errorMessage() }}
          </div>
        }
      </div>

      <!-- Indicador sutil de interactividad del mar -->
      <div class="relative z-10 mt-3 px-4 py-1.5 rounded-full bg-[#070b16]/65 backdrop-blur-md border border-pink-200/20 text-blue-100/85 text-[12px] pointer-events-none">
        🌸 Mueve el cursor o arrastra para explorar el mar bajo la luna
      </div>
    </div>
  `,
})
export class LoginPortalComponent implements OnInit {
  @Input() public initialTab: LoginModeTab = 'ESTUDIANTE';
  @Output() public readonly closed = new EventEmitter<void>();

  public readonly authSession = inject(AuthSessionService);
  public readonly dojoApi = inject(DojoApiService);

  public readonly activeTab = signal<LoginModeTab>('ESTUDIANTE');
  public readonly errorMessage = signal<string>('');
  public readonly isClosing = signal<boolean>(false);

  public studentCedula: string = '';
  public adminCedula: string = '';
  public adminPassword: string = '';

  public ngOnInit(): void {
    this.activeTab.set(this.initialTab);
  }

  public onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeWithAnimation();
    }
  }

  public closeWithAnimation(): void {
    if (this.isClosing()) return;
    this.isClosing.set(true);
    setTimeout(() => {
      this.closed.emit();
    }, 360);
  }

  public selectTab(tab: LoginModeTab): void {
    this.activeTab.set(tab);
    this.errorMessage.set('');
  }

  public onStudentSubmit(): void {
    this.errorMessage.set('');
    const res = this.authSession.loginStudentByCedulaOnly(this.studentCedula);
    if (res.success) {
      this.closeWithAnimation();
    } else {
      this.errorMessage.set(res.message);
    }
  }

  public quickStudentLogin(cedula: string): void {
    this.studentCedula = cedula;
    this.onStudentSubmit();
  }

  public onAdminSubmit(): void {
    this.errorMessage.set('');
    const res = this.authSession.loginAdminWithCedulaAndPassword(
      this.adminCedula,
      this.adminPassword
    );
    if (res.success) {
      this.closeWithAnimation();
    } else {
      this.errorMessage.set(res.message);
    }
  }

  public quickAdminLogin(): void {
    this.adminCedula = '1000100100';
    this.adminPassword = 'AdminDojo2026!';
    this.onAdminSubmit();
  }
}
