/**
 * @file student-mobile-home.component.ts
 * @description Vista limpia y estructurada con ambiente "Moonlit Lotus Glass" para el
 *              Usuario Final (`ESTUDIANTE`) que ingresa únicamente con su número de Cédula.
 */

import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DojoApiService } from '../../core/services/dojo-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { NativeGeofenceService } from '../../core/services/native-geofence.service';
import { StudentFullRecord } from '../../core/models/dojo.models';

@Component({
  selector: 'app-student-mobile-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      @if (studentProfile(); as student) {
        <!-- BANNER SI EL USUARIO TIENE PERMISOS DELEGADOS PARA DAR LA CLASE -->
        @if (student.hasDelegatedClassPermission) {
          <div class="lotus-glass-card p-5 border-amber-300/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span class="inline-block px-3 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-[11px] font-bold mb-1">
                🎖️ Permiso Delegado por el Administrador
              </span>
              <h3 class="text-[18px] font-semibold text-white">
                Tienes permisos activos para dirigir la clase
              </h3>
              <p class="text-[13px] text-blue-100/75 mt-0.5">
                Puedes ver quién vino hoy, editar si vino o no, y anotar qué hizo cada persona en la sesión.
              </p>
            </div>
            <button
              type="button"
              (click)="openDelegatedClassControl()"
              class="lotus-primary-pill px-5 py-2.5 text-[13px] whitespace-nowrap"
            >
              🥋 Abrir Control de Clase →
            </button>
          </div>
        }

        <!-- 1. ENCABEZADO DE PERFIL DEL USUARIO -->
        <div class="lotus-glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div class="flex items-center gap-4">
            <img
              [src]="student.profilePhotoUrl"
              [alt]="student.firstName"
              class="w-18 h-18 rounded-full object-cover border-2 border-pink-300/45 shadow-lg"
            />
            <div>
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <span class="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-pink-100 text-[11px] font-semibold">
                  Cédula: {{ student.documentNumber }}
                </span>
                @if (student.isCurrentlyInClass) {
                  <span class="px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-400/35 text-emerald-200 text-[11px] font-semibold">
                    ● Asistencia registrada hoy
                  </span>
                }
              </div>
              <h2 class="text-[24px] font-semibold text-white leading-tight">
                {{ student.firstName }} {{ student.lastName }}
              </h2>
              <p class="text-[13px] text-blue-100/75 mt-1">
                <strong class="text-white">RH:</strong> <span class="text-pink-300 font-semibold">{{ student.bloodType }}</span> ·
                <strong class="text-white">EPS:</strong> {{ student.epsEntity }} ·
                <strong class="text-white">Tel:</strong> {{ student.phone }}
              </p>
            </div>
          </div>

          <div class="flex flex-col items-start md:items-end gap-1.5">
            <span
              class="px-4 py-1.5 rounded-full text-[13px] font-semibold border border-white/25"
              [style.backgroundColor]="student.beltColorHex"
              [style.color]="student.beltColorHex === '#FFFFFF' || student.beltColorHex === '#FACC15' ? '#1d1d1f' : '#ffffff'"
            >
              🥋 {{ student.beltName }}
            </span>
            <span class="text-[12px] text-blue-200/65">
              Emergencia: {{ student.emergencyContactName }} ({{ student.emergencyContactPhone }})
            </span>
          </div>
        </div>

        <!-- 2. TARJETA PRINCIPAL DE MENSUALIDAD Y DATOS DE SALUD -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Estado de Mensualidad -->
          <div class="lotus-glass-card p-6 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="text-[12px] font-semibold text-blue-200/65 uppercase tracking-wider">
                  Estado de Mensualidad
                </span>
                <span
                  class="px-3 py-0.5 rounded-full text-[12px] font-semibold"
                  [ngClass]="{
                    'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30': student.trafficLight === 'VERDE',
                    'bg-amber-400/20 text-amber-200 border border-amber-400/30': student.trafficLight === 'AMARILLO',
                    'bg-rose-400/20 text-rose-200 border border-rose-400/30': student.trafficLight === 'ROJO'
                  }"
                >
                  ● {{ student.membershipStatus }} ({{ student.trafficLight }})
                </span>
              </div>

              <div class="my-4">
                @if (student.daysRemaining >= 0) {
                  <p class="text-[38px] font-bold text-white leading-none">
                    {{ student.daysRemaining }}
                    <span class="text-[17px] font-normal text-blue-200/75">días disponibles</span>
                  </p>
                } @else {
                  <p class="text-[30px] font-bold text-rose-300 leading-none">
                    Mensualidad Vencida
                    <span class="block text-[14px] font-normal text-blue-200/70 mt-1">
                      Venció hace {{ -student.daysRemaining }} días
                    </span>
                  </p>
                }
              </div>

              <div class="w-full h-2.5 rounded-full bg-white/10 overflow-hidden my-4">
                <div
                  class="h-full rounded-full transition-all"
                  [ngClass]="{
                    'bg-emerald-400': student.trafficLight === 'VERDE',
                    'bg-amber-400': student.trafficLight === 'AMARILLO',
                    'bg-rose-500': student.trafficLight === 'ROJO'
                  }"
                  [style.width.%]="getProgressPercentage(student)"
                ></div>
              </div>
            </div>

            <div class="pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-[12px]">
              <div>
                <span class="text-blue-200/60 block">Fecha Inicio</span>
                <strong class="text-white">{{ student.membershipStartDate }}</strong>
              </div>
              <div>
                <span class="text-blue-200/60 block">Fecha Corte</span>
                <strong class="text-white">{{ student.membershipEndDate }}</strong>
              </div>
              <div>
                <span class="text-blue-200/60 block">Valor Ciclo</span>
                <strong class="text-pink-200">\${{ student.amountPaid.toLocaleString() }}</strong>
              </div>
            </div>
          </div>

          <!-- Ficha Médica y Asistencia en el Dojo -->
          <div class="lotus-glass-card p-6 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="text-[12px] font-semibold text-blue-200/65 uppercase tracking-wider">
                  Datos de Salud y Asistencia
                </span>
                <span class="px-2.5 py-0.5 rounded-full bg-pink-300/15 border border-pink-300/30 text-pink-200 text-[11px] font-semibold">
                  GPS / Tatami
                </span>
              </div>

              <div class="space-y-2.5 text-[13px] text-blue-100/80 my-3">
                <div class="flex justify-between py-1.5 border-b border-white/10">
                  <span class="text-blue-200/60">Dirección registrada:</span>
                  <strong class="text-white">{{ student.address }}</strong>
                </div>
                <div class="flex justify-between py-1.5 border-b border-white/10">
                  <span class="text-blue-200/60">Contacto de Emergencia:</span>
                  <strong class="text-white">{{ student.emergencyContactName }} ({{ student.emergencyContactRelationship }})</strong>
                </div>
                <div class="flex justify-between py-1.5 border-b border-white/10">
                  <span class="text-blue-200/60">Observaciones médicas:</span>
                  <strong class="text-white text-right max-w-[240px]">{{ student.medicalNotes }}</strong>
                </div>
              </div>
            </div>

            <div class="pt-3 flex items-center justify-between gap-2">
              <span class="text-[12px] text-blue-200/65">
                Distancia GPS al Dojo: <strong class="text-pink-200">{{ geofence.state().distanceMeters }}m</strong>
              </span>
              <button
                type="button"
                (click)="geofence.simulateOrTriggerDojoGeofenceCheckIn(student.id, 9.5, 20)"
                class="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-[12px] font-semibold transition"
              >
                📍 Registrar Llegada GPS
              </button>
            </div>
          </div>
        </div>

        <!-- 3. HISTORIAL DE CLASES Y QUÉ HIZO EN CADA SESIÓN + ASCENSOS -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="lotus-glass-card p-6">
            <h3 class="text-[17px] font-semibold text-white mb-4">
              🌸 Mis Clases y Actividades Realizadas
            </h3>
            @if (myClassHistory().length > 0) {
              <div class="space-y-3">
                @for (cls of myClassHistory(); track cls.id) {
                  <div class="lotus-glass-subcard p-4">
                    <div class="flex items-center justify-between text-[12px] mb-1.5">
                      <span class="font-semibold text-pink-100">📅 {{ cls.sessionDate }} · {{ cls.checkInTime }}</span>
                      <span
                        class="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                        [ngClass]="cls.isCurrentlyInClass ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30' : 'bg-white/10 text-blue-200'"
                      >
                        {{ cls.isCurrentlyInClass ? 'Asistió' : 'Ausente' }}
                      </span>
                    </div>
                    <p class="text-[13.5px] text-white font-medium">
                      {{ cls.techniquesPracticed || 'Asistencia registrada en clase' }}
                    </p>
                    @if (cls.trainingObservations) {
                      <p class="text-[12px] text-blue-100/75 mt-1">
                        Observación: {{ cls.trainingObservations }}
                      </p>
                    }
                    <p class="text-[11px] text-blue-200/55 mt-1.5">
                      Registrado por: {{ cls.recordedByName }}
                    </p>
                  </div>
                }
              </div>
            } @else {
              <p class="text-[13px] text-blue-200/60">
                Aún no tienes sesiones registradas en la bitácora.
              </p>
            }
          </div>

          <div class="lotus-glass-card p-6">
            <h3 class="text-[17px] font-semibold text-white mb-4">
              🏅 Progreso de Cinturones y Ascensos
            </h3>
            @if (student.beltPromotions.length > 0) {
              <div class="space-y-3">
                @for (promo of student.beltPromotions; track promo.id) {
                  <div class="lotus-glass-subcard p-4">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-[14px] font-semibold text-pink-100">
                        {{ promo.previousBeltName }} → {{ promo.newBeltName }}
                      </span>
                      <span class="text-[12px] text-blue-200/60">{{ promo.promotionDate }}</span>
                    </div>
                    <p class="text-[13px] text-blue-100/80">
                      Puntaje: <strong class="text-white">{{ promo.examScore }}/100</strong> · {{ promo.senseiNotes }}
                    </p>
                    <p class="text-[11px] text-blue-200/55 mt-1">
                      Certificado por: {{ promo.promotedByName }}
                    </p>
                  </div>
                }
              </div>
            } @else {
              <div class="lotus-glass-subcard p-4 text-[13px] text-blue-100/75">
                Grado actual: <strong class="text-pink-200">{{ student.beltName }}</strong>. Tus próximos ascensos aparecerán aquí.
              </div>
            }
          </div>
        </div>
      }
    </section>
  `,
})
export class StudentMobileHomeComponent {
  public readonly dojoApi = inject(DojoApiService);
  public readonly authSession = inject(AuthSessionService);
  public readonly geofence = inject(NativeGeofenceService);

  public readonly studentProfile = computed(() => {
    const user = this.authSession.currentUser();
    return (
      this.dojoApi.students().find(
        (s) => s.id === user.studentId || s.documentNumber === user.documentNumber
      ) || this.dojoApi.students()[0]
    );
  });

  public readonly myClassHistory = computed(() => {
    const profile = this.studentProfile();
    return this.dojoApi.classLogs().filter((c) => c.studentId === profile.id);
  });

  public getProgressPercentage(student: StudentFullRecord): number {
    if (student.trafficLight === 'ROJO') return 100;
    const pct = Math.round((student.daysRemaining / student.cycleDays) * 100);
    return Math.max(8, Math.min(100, pct));
  }

  public openDelegatedClassControl(): void {
    this.authSession.setWorkspaceView('AYUDANTE');
  }
}
