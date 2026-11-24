/**
 * @file admin-dashboard.component.ts
 * @description Panel Principal limpio y estructurado del Rol `ADMIN` con ambiente
 *              nocturno "Moonlit Lotus Glass":
 *              1. Navegación por pestañas en una sola línea limpia.
 *              2. Tarjetas de resumen en cristal translúcido nocturno.
 *              3. Directorio de Discípulos, Semáforo de Mensualidades y Delegación de Clase.
 */

import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DojoApiService } from '../../core/services/dojo-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { StudentOcrFormComponent } from './student-ocr-form.component';
import { AuditViewerComponent } from './audit-viewer.component';
import { AssistantClassLogComponent } from '../assistant/assistant-class-log.component';
import { StudentFullRecord } from '../../core/models/dojo.models';

export type AdminSectionTab = 'DISCIPULOS' | 'CLASE_HOY' | 'NUEVO_OCR' | 'AUDITORIA';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StudentOcrFormComponent,
    AuditViewerComponent,
    AssistantClassLogComponent,
  ],
  template: `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-7">
      <!-- 1. CABECERA ESTRUCTURADA CON PESTAÑAS EN UNA SOLA LÍNEA -->
      <div class="lotus-glass-card p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        <div>
          <span class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-pink-300/15 border border-pink-300/30 text-pink-200 text-[11px] font-semibold mb-2">
            🌸 Administración General · Shifu
          </span>
          <h2 class="text-[26px] sm:text-[28px] font-semibold tracking-tight text-white">
            Panel de Control del Dojo
          </h2>
          <p class="text-[13.5px] text-blue-100/75 mt-0.5">
            Gestiona mensualidades, delega permisos de clase a cualquier encargado y supervisa la asistencia del día.
          </p>
        </div>

        <!-- Pestañas limpias en una sola fila -->
        <div class="inline-flex flex-wrap sm:flex-nowrap gap-1.5 p-1.5 rounded-[16px] bg-[#050914]/80 border border-pink-200/15 self-start xl:self-center">
          <button
            type="button"
            (click)="activeSection.set('DISCIPULOS')"
            [class]="
              activeSection() === 'DISCIPULOS'
                ? 'px-4 py-2 rounded-[11px] bg-gradient-to-r from-[#22325a] to-[#31254d] text-pink-100 border border-pink-300/30 text-[13px] font-semibold shadow-sm whitespace-nowrap transition'
                : 'px-4 py-2 rounded-[11px] text-blue-200/70 hover:text-white text-[13px] font-medium whitespace-nowrap transition'
            "
          >
            👥 Discípulos y Delegación
          </button>
          <button
            type="button"
            (click)="activeSection.set('CLASE_HOY')"
            [class]="
              activeSection() === 'CLASE_HOY'
                ? 'px-4 py-2 rounded-[11px] bg-gradient-to-r from-[#22325a] to-[#31254d] text-pink-100 border border-pink-300/30 text-[13px] font-semibold shadow-sm whitespace-nowrap transition'
                : 'px-4 py-2 rounded-[11px] text-blue-200/70 hover:text-white text-[13px] font-medium whitespace-nowrap transition'
            "
          >
            🥋 Clase de Hoy ({{ currentlyInClassCount() }})
          </button>
          <button
            type="button"
            (click)="activeSection.set('NUEVO_OCR')"
            [class]="
              activeSection() === 'NUEVO_OCR'
                ? 'px-4 py-2 rounded-[11px] bg-gradient-to-r from-[#22325a] to-[#31254d] text-pink-100 border border-pink-300/30 text-[13px] font-semibold shadow-sm whitespace-nowrap transition'
                : 'px-4 py-2 rounded-[11px] text-blue-200/70 hover:text-white text-[13px] font-medium whitespace-nowrap transition'
            "
          >
            📷 Nuevo Alumno (OCR)
          </button>
          <button
            type="button"
            (click)="activeSection.set('AUDITORIA')"
            [class]="
              activeSection() === 'AUDITORIA'
                ? 'px-4 py-2 rounded-[11px] bg-gradient-to-r from-[#22325a] to-[#31254d] text-pink-100 border border-pink-300/30 text-[13px] font-semibold shadow-sm whitespace-nowrap transition'
                : 'px-4 py-2 rounded-[11px] text-blue-200/70 hover:text-white text-[13px] font-medium whitespace-nowrap transition'
            "
          >
            🛡️ Auditoría
          </button>
        </div>
      </div>

      <!-- 2. TARJETAS DE RESUMEN MOONLIT LOTUS -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div class="lotus-glass-card p-5">
          <span class="text-[11px] font-semibold text-blue-200/65 uppercase tracking-wider">Vinieron Hoy</span>
          <p class="text-[30px] font-bold text-white mt-1.5 leading-none">{{ currentlyInClassCount() }}</p>
        
        </div>

        <div class="lotus-glass-card p-5">
          <span class="text-[11px] font-semibold text-blue-200/65 uppercase tracking-wider">Al Día</span>
          <p class="text-[30px] font-bold text-emerald-300 mt-1.5 leading-none">{{ greenMembershipsCount() }}</p>
     
        </div>

        <div class="lotus-glass-card p-5">
          <span class="text-[11px] font-semibold text-blue-200/65 uppercase tracking-wider">Por Vencer</span>
          <p class="text-[30px] font-bold text-amber-300 mt-1.5 leading-none">{{ yellowMembershipsCount() }}</p>
       
        </div>

        <div class="lotus-glass-card p-5">
          <span class="text-[11px] font-semibold text-blue-200/65 uppercase tracking-wider">Vencidas</span>
          <p class="text-[30px] font-bold text-rose-300 mt-1.5 leading-none">{{ redMembershipsCount() }}</p>
    
        </div>

        <div class="lotus-glass-card p-5 col-span-2 lg:col-span-1">
          <span class="text-[11px] font-semibold text-blue-200/65 uppercase tracking-wider">Delegados de Clase</span>
          <p class="text-[30px] font-bold text-pink-200 mt-1.5 leading-none">{{ delegatedCount() }}</p>
          
        </div>
      </div>

      @if (adminFeedback()) {
        <div class="p-4 rounded-[16px] bg-pink-300/15 border border-pink-300/35 text-pink-100 text-[13px] font-medium flex items-center justify-between animate-dojo-tab">
          <span>🌸 {{ adminFeedback() }}</span>
          <button type="button" (click)="adminFeedback.set('')" class="text-[12px] text-pink-200 underline ml-4">Cerrar</button>
        </div>
      }

      <!-- PESTAÑA 1: DISCÍPULOS, MENSUALIDADES Y DELEGACIÓN DE PERMISOS DE CLASE -->
      @if (activeSection() === 'DISCIPULOS') {
        <div class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div>
              <h3 class="text-[19px] font-semibold text-white">
                Directorio de Discípulos, Mensualidades y Delegación de Clase
              </h3>
              <p class="text-[13px] text-blue-200/70">
                Activa <strong class="text-pink-200">"Delegar Permiso de Clase"</strong> en cualquier usuario para que al ingresar con su cédula pueda registrar quién vino y qué hizo cada asistente.
              </p>
            </div>
            <input
              type="text"
              [(ngModel)]="studentSearch"
              placeholder="Buscar por nombre o cédula..."
              class="lotus-glass-input px-4 py-2.5 text-[14px] w-full sm:w-72"
            />
          </div>

          <div class="space-y-4">
            @for (student of filteredStudents(); track student.id) {
              <div class="lotus-glass-card p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition hover:border-pink-300/35">
                <!-- Columna 1: Información del Discípulo -->
                <div class="flex items-start gap-4">
                  <img
                    [src]="student.profilePhotoUrl"
                    [alt]="student.firstName"
                    class="w-14 h-14 rounded-full object-cover border-2 border-pink-200/30 shadow-md"
                  />
                  <div>
                    <div class="flex flex-wrap items-center gap-2">
                      <h4 class="text-[17px] font-semibold text-white">
                        {{ student.firstName }} {{ student.lastName }}
                      </h4>
                      <span
                        class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-white/20"
                        [style.backgroundColor]="student.beltColorHex"
                        [style.color]="student.beltColorHex === '#FFFFFF' || student.beltColorHex === '#FACC15' ? '#1d1d1f' : '#ffffff'"
                      >
                        🥋 {{ student.beltName }}
                      </span>
                      @if (student.hasDelegatedClassPermission) {
                        <span class="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-[11px] font-semibold">
                          🎖️ Encargado Delegado de Clase
                        </span>
                      }
                      @if (student.isCurrentlyInClass) {
                        <span class="px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-400/35 text-emerald-200 text-[11px] font-semibold">
                          ● Vino hoy
                        </span>
                      }
                    </div>

                    <p class="text-[13px] text-blue-100/80 mt-1.5">
                      <strong class="text-white">CC:</strong> {{ student.documentNumber }} ·
                      <strong class="text-white">RH:</strong> <span class="text-pink-300 font-semibold">{{ student.bloodType }}</span> ·
                      <strong class="text-white">EPS:</strong> {{ student.epsEntity }} ·
                      <strong class="text-white">Tel:</strong> {{ student.phone }}
                    </p>
                    <p class="text-[12px] text-blue-200/60 mt-0.5">
                      Emergencia: {{ student.emergencyContactName }} ({{ student.emergencyContactRelationship }}) — {{ student.emergencyContactPhone }}
                    </p>
                  </div>
                </div>

                <!-- Columna 2: Semáforo de Mensualidad en Cristal Oscuro -->
                <div class="lotus-glass-subcard p-4 min-w-[255px]">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-[11px] font-semibold text-blue-200/65 uppercase tracking-wider">Mensualidad</span>
                    <span
                      class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                      [ngClass]="{
                        'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30': student.trafficLight === 'VERDE',
                        'bg-amber-400/20 text-amber-200 border border-amber-400/30': student.trafficLight === 'AMARILLO',
                        'bg-rose-400/20 text-rose-200 border border-rose-400/30': student.trafficLight === 'ROJO'
                      }"
                    >
                      ● {{ student.trafficLight }} ({{ student.membershipStatus }})
                    </span>
                  </div>

                  <div class="w-full h-2 rounded-full bg-white/10 overflow-hidden my-2.5">
                    <div
                      class="h-full rounded-full transition-all duration-300"
                      [ngClass]="{
                        'bg-emerald-400': student.trafficLight === 'VERDE',
                        'bg-amber-400': student.trafficLight === 'AMARILLO',
                        'bg-rose-500': student.trafficLight === 'ROJO'
                      }"
                      [style.width.%]="getProgressPercentage(student)"
                    ></div>
                  </div>

                  <div class="flex justify-between text-[11.5px] text-blue-100/75">
                    <span>Corte: {{ student.membershipEndDate }}</span>
                    <span>
                      @if (student.daysRemaining >= 0) {
                        <strong class="text-white">{{ student.daysRemaining }} días rest.</strong>
                      } @else {
                        <strong class="text-rose-300">Vencida ({{ -student.daysRemaining }}d)</strong>
                      }
                    </span>
                  </div>
                </div>

                <!-- Columna 3: Acciones Administrativas y Delegación de Clase -->
                <div class="flex flex-col gap-2 min-w-[245px]">
                  <button
                    type="button"
                    (click)="toggleDelegation(student)"
                    [class]="
                      student.hasDelegatedClassPermission
                        ? 'py-2 px-4 rounded-full bg-amber-400/20 border border-amber-300/45 text-amber-100 text-[12px] font-semibold hover:bg-amber-400/30 transition text-center'
                        : 'py-2 px-4 rounded-full bg-white/10 border border-white/15 text-blue-100 text-[12px] font-semibold hover:bg-white/15 transition text-center'
                    "
                  >
                    {{
                      student.hasDelegatedClassPermission
                        ? '🎖️ Permiso de Clase Activo (Quitar)'
                        : '🎖️ Delegar Permiso de Clase'
                    }}
                  </button>

                  <div class="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      (click)="confirmManualRenewal(student)"
                      class="lotus-primary-pill py-1.5 px-3 text-[12px] text-center"
                    >
                      💳 Renovar 30d
                    </button>
                    <button
                      type="button"
                      (click)="promoteToNextBelt(student)"
                      class="py-1.5 px-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-[12px] font-medium transition text-center"
                    >
                      ⬆️ Ascender
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- PESTAÑA 2: CONTROL DE ASISTENCIA Y QUÉ HIZO CADA PERSONA HOY -->
      @if (activeSection() === 'CLASE_HOY') {
        <app-assistant-class-log></app-assistant-class-log>
      }

      <!-- PESTAÑA 3: MÓDULO OCR DE REGISTRO -->
      @if (activeSection() === 'NUEVO_OCR') {
        <app-student-ocr-form></app-student-ocr-form>
      }

      <!-- PESTAÑA 4: BITÁCORA DE AUDITORÍA -->
      @if (activeSection() === 'AUDITORIA') {
        <app-audit-viewer></app-audit-viewer>
      }
    </section>
  `,
})
export class AdminDashboardComponent {
  public readonly dojoApi = inject(DojoApiService);
  private readonly authSession = inject(AuthSessionService);

  public readonly activeSection = signal<AdminSectionTab>('DISCIPULOS');
  public readonly adminFeedback = signal<string>('');
  public studentSearch: string = '';

  public readonly currentlyInClassCount = computed(
    () => this.dojoApi.students().filter((s) => s.isCurrentlyInClass).length
  );
  public readonly greenMembershipsCount = computed(
    () => this.dojoApi.students().filter((s) => s.trafficLight === 'VERDE').length
  );
  public readonly yellowMembershipsCount = computed(
    () => this.dojoApi.students().filter((s) => s.trafficLight === 'AMARILLO').length
  );
  public readonly redMembershipsCount = computed(
    () => this.dojoApi.students().filter((s) => s.trafficLight === 'ROJO').length
  );
  public readonly delegatedCount = computed(
    () => this.dojoApi.students().filter((s) => s.hasDelegatedClassPermission).length
  );

  public readonly filteredStudents = computed(() => {
    const term = this.studentSearch.trim().toLowerCase();
    if (!term) return this.dojoApi.students();
    return this.dojoApi.students().filter((s) =>
      `${s.firstName} ${s.lastName} ${s.documentNumber}`.toLowerCase().includes(term)
    );
  });

  public getProgressPercentage(student: StudentFullRecord): number {
    if (student.trafficLight === 'ROJO') return 100;
    const pct = Math.round((student.daysRemaining / student.cycleDays) * 100);
    return Math.max(8, Math.min(100, pct));
  }

  public toggleDelegation(student: StudentFullRecord): void {
    const granted = this.dojoApi.toggleClassDelegation(
      student.id,
      this.authSession.currentUser()
    );
    this.adminFeedback.set(
      granted
        ? `Permiso de clase delegado a ${student.firstName} ${student.lastName} (CC ${student.documentNumber}).`
        : `Permiso de clase revocado para ${student.firstName} ${student.lastName}.`
    );
  }

  public confirmManualRenewal(student: StudentFullRecord): void {
    this.dojoApi.confirmManualMembershipRenewal(
      student.id,
      160000,
      this.authSession.currentUser()
    );
    this.adminFeedback.set(
      `Mensualidad renovada por 30 días para ${student.firstName} ${student.lastName}.`
    );
  }

  public promoteToNextBelt(student: StudentFullRecord): void {
    const nextBeltId = Math.min(7, student.currentBeltId + 1);
    this.dojoApi.promoteStudentBelt(
      student.id,
      nextBeltId,
      'Examen técnico aprobado ante el Shifu.',
      this.authSession.currentUser()
    );
    this.adminFeedback.set(
      `Ascenso de grado registrado para ${student.firstName} ${student.lastName}.`
    );
  }
}
