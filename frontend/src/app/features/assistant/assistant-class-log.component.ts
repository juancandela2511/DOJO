/**
 * @file assistant-class-log.component.ts
 * @description Vista de Control de Clase con ambiente "Moonlit Lotus Glass" para cualquier
 *              persona a quien se le delegaron permisos para hacer la clase:
 *              1. Ver quién vino y quién no vino a la clase de hoy.
 *              2. Editar con un clic si cada persona vino o no (`Vino a clase` / `No vino`).
 *              3. Poner y editar qué hizo cada persona que vino.
 */

import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DojoApiService } from '../../core/services/dojo-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { StudentFullRecord } from '../../core/models/dojo.models';

export type AttendanceFilter = 'TODOS' | 'VINIERON' | 'NO_VINIERON';

@Component({
  selector: 'app-assistant-class-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <!-- ENCABEZADO EN CRISTAL NOCTURNO MOONLIT LOTUS -->
      <div class="lotus-glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex flex-wrap items-center gap-2 mb-1.5">
            <span class="px-3 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/35 text-amber-200 text-[11px] font-semibold">
              🎖️ Control de Clase · Permiso Delegado Activo
            </span>
            <span class="text-[12px] text-blue-200/75">
              Encargado(a): <strong class="text-white">{{ authSession.currentUser().fullName }}</strong>
              (CC {{ authSession.currentUser().documentNumber }})
            </span>
          </div>
          <h2 class="text-[25px] font-semibold tracking-tight text-white">
            Asistencia y Actividades de la Clase de Hoy
          </h2>
          <p class="text-[13.5px] text-blue-100/75 mt-0.5">
            Verifica quién vino hoy, edita si asistió o no, y registra qué ejercicios o técnicas realizó cada persona.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          @if (authSession.currentUser().role !== 'ADMIN') {
            <button
              type="button"
              (click)="authSession.setWorkspaceView('ESTUDIANTE')"
              class="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-pink-100 text-[12px] font-semibold border border-pink-200/25 transition"
            >
              ← Ver Mi Mensualidad y Datos
            </button>
          }
          <div class="px-4 py-2.5 rounded-[16px] bg-emerald-400/15 border border-emerald-400/30 text-center min-w-[105px]">
            <span class="block text-[22px] font-bold text-emerald-300 leading-none">{{ attendedCount() }}</span>
            <span class="text-[11px] font-semibold text-emerald-200/80">Vinieron hoy</span>
          </div>
          <div class="px-4 py-2.5 rounded-[16px] bg-white/5 border border-white/15 text-center min-w-[105px]">
            <span class="block text-[22px] font-bold text-blue-100 leading-none">{{ absentCount() }}</span>
            <span class="text-[11px] font-semibold text-blue-200/65">No vinieron</span>
          </div>
        </div>
      </div>

      <!-- BARRA DE FILTROS Y BÚSQUEDA -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="inline-flex p-1.5 rounded-[14px] bg-[#050914]/80 border border-pink-200/15">
          <button
            type="button"
            (click)="filterMode.set('TODOS')"
            [class]="
              filterMode() === 'TODOS'
                ? 'px-3.5 py-1.5 rounded-[10px] bg-gradient-to-r from-[#22325a] to-[#31254d] text-pink-100 border border-pink-300/30 text-[13px] font-semibold shadow-sm'
                : 'px-3.5 py-1.5 rounded-[10px] text-blue-200/70 hover:text-white text-[13px] font-medium'
            "
          >
            Todos ({{ dojoApi.students().length }})
          </button>
          <button
            type="button"
            (click)="filterMode.set('VINIERON')"
            [class]="
              filterMode() === 'VINIERON'
                ? 'px-3.5 py-1.5 rounded-[10px] bg-emerald-400/20 text-emerald-200 border border-emerald-400/35 text-[13px] font-semibold shadow-sm'
                : 'px-3.5 py-1.5 rounded-[10px] text-blue-200/70 hover:text-white text-[13px] font-medium'
            "
          >
            ✓ Vinieron ({{ attendedCount() }})
          </button>
          <button
            type="button"
            (click)="filterMode.set('NO_VINIERON')"
            [class]="
              filterMode() === 'NO_VINIERON'
                ? 'px-3.5 py-1.5 rounded-[10px] bg-rose-400/20 text-rose-200 border border-rose-400/35 text-[13px] font-semibold shadow-sm'
                : 'px-3.5 py-1.5 rounded-[10px] text-blue-200/70 hover:text-white text-[13px] font-medium'
            "
          >
            ✕ No vinieron ({{ absentCount() }})
          </button>
        </div>

        <input
          type="text"
          [(ngModel)]="searchTerm"
          placeholder="Buscar por nombre o cédula..."
          class="lotus-glass-input px-4 py-2.5 text-[14px] w-full sm:w-72"
        />
      </div>

      @if (feedbackBanner()) {
        <div class="p-3.5 rounded-[14px] bg-pink-300/15 border border-pink-300/35 text-pink-100 text-[13px] font-medium flex items-center justify-between animate-dojo-tab">
          <span>🌸 {{ feedbackBanner() }}</span>
          <button type="button" (click)="feedbackBanner.set('')" class="text-[12px] text-pink-200 underline">Ocultar</button>
        </div>
      }

      <!-- LISTA INTERACTIVA DE PERSONAS -->
      <div class="space-y-4">
        @for (student of filteredStudents(); track student.id) {
          <div
            class="lotus-glass-card p-5 sm:p-6 transition"
            [ngClass]="
              student.isCurrentlyInClass
                ? 'border-emerald-400/35'
                : 'opacity-85'
            "
          >
            <!-- Fila Superior: Datos de la Persona + Selector "Vino / No Vino" -->
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div class="flex items-center gap-3.5">
                <img
                  [src]="student.profilePhotoUrl"
                  [alt]="student.firstName"
                  class="w-13 h-13 rounded-full object-cover border-2 border-pink-200/30"
                />
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="text-[17px] font-semibold text-white">
                      {{ student.firstName }} {{ student.lastName }}
                    </h3>
                    <span
                      class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-white/20"
                      [style.backgroundColor]="student.beltColorHex"
                      [style.color]="student.beltColorHex === '#FFFFFF' || student.beltColorHex === '#FACC15' ? '#1d1d1f' : '#ffffff'"
                    >
                      {{ student.beltName }}
                    </span>
                    <span
                      class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                      [ngClass]="{
                        'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30': student.trafficLight === 'VERDE',
                        'bg-amber-400/20 text-amber-200 border border-amber-400/30': student.trafficLight === 'AMARILLO',
                        'bg-rose-400/20 text-rose-200 border border-rose-400/30': student.trafficLight === 'ROJO'
                      }"
                    >
                      Mensualidad {{ student.trafficLight }}
                    </span>
                  </div>
                  <p class="text-[12.5px] text-blue-100/75 mt-1">
                    <strong class="text-white">CC:</strong> {{ student.documentNumber }} ·
                    <strong class="text-white">RH:</strong> <span class="text-pink-300 font-semibold">{{ student.bloodType }}</span> ·
                    <strong class="text-white">EPS:</strong> {{ student.epsEntity }} ·
                    <strong class="text-white">Emergencia:</strong> {{ student.emergencyContactName }} ({{ student.emergencyContactPhone }})
                  </p>
                </div>
              </div>

              <!-- Control Directo: Editar si Vino o No -->
              <div class="flex items-center gap-2 self-start lg:self-center">
                <span class="text-[12px] font-medium text-blue-200/65 mr-1">¿Asistió hoy?</span>
                <button
                  type="button"
                  (click)="setStudentAttendance(student, true)"
                  [class]="
                    student.isCurrentlyInClass
                      ? 'px-4 py-1.5 rounded-full bg-emerald-400 text-[#06120e] text-[13px] font-semibold shadow-[0_0_16px_rgba(52,211,153,0.3)] transition'
                      : 'px-4 py-1.5 rounded-full bg-white/10 text-blue-100/75 hover:bg-emerald-400/20 hover:text-emerald-200 text-[13px] font-medium transition'
                  "
                >
                  ✓ Vino a clase
                </button>
                <button
                  type="button"
                  (click)="setStudentAttendance(student, false)"
                  [class]="
                    !student.isCurrentlyInClass
                      ? 'px-4 py-1.5 rounded-full bg-rose-500/80 text-white text-[13px] font-semibold shadow-sm transition'
                      : 'px-4 py-1.5 rounded-full bg-white/10 text-blue-100/75 hover:bg-rose-500/20 hover:text-rose-200 text-[13px] font-medium transition'
                  "
                >
                  ✕ No vino
                </button>
              </div>
            </div>

            <!-- Fila Inferior: Poner qué hizo cada persona que vino -->
            @if (student.isCurrentlyInClass) {
              <div class="pt-4 space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <label class="text-[12.5px] font-semibold text-pink-100">
                    🥋 ¿Qué hizo {{ student.firstName }} hoy en la clase?
                  </label>
                  <div class="flex flex-wrap items-center gap-1.5">
                    <span class="text-[11px] text-blue-200/60">Agregar rápido:</span>
                    @for (tag of quickTags; track tag) {
                      <button
                        type="button"
                        (click)="appendQuickTag(student.id, tag)"
                        class="px-2.5 py-0.5 rounded-md bg-white/10 hover:bg-pink-300/20 border border-white/10 text-blue-100 text-[11px] font-medium transition"
                      >
                        + {{ tag }}
                      </button>
                    }
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                  <div class="md:col-span-6">
                    <input
                      type="text"
                      [ngModel]="activityDrafts[student.id]?.techniques || ''"
                      (ngModelChange)="updateDraftTechniques(student.id, $event)"
                      placeholder="Escribe qué ejercicios, formas o combate realizó hoy..."
                      class="lotus-glass-input w-full px-3.5 py-2.5 text-[14px]"
                    />
                  </div>
                  <div class="md:col-span-4">
                    <input
                      type="text"
                      [ngModel]="activityDrafts[student.id]?.observations || ''"
                      (ngModelChange)="updateDraftObservations(student.id, $event)"
                      placeholder="Observaciones (ej. buen ritmo, corregir postura)..."
                      class="lotus-glass-input w-full px-3.5 py-2.5 text-[14px]"
                    />
                  </div>
                  <div class="md:col-span-2">
                    <button
                      type="button"
                      (click)="saveStudentActivity(student)"
                      class="w-full lotus-primary-pill py-2.5 px-4 text-[13px] text-center"
                    >
                      Guardar
                    </button>
                  </div>
                </div>

                @if (dojoApi.getTodayLogForStudent(student.id); as todayLog) {
                  <p class="text-[12px] text-blue-200/65">
                    Último registro hoy ({{ todayLog.checkInTime }}):
                    <strong class="text-pink-100">{{ todayLog.techniquesPracticed || 'Asistencia registrada sin detalle aún' }}</strong>
                    @if (todayLog.trainingObservations) {
                      · <em>{{ todayLog.trainingObservations }}</em>
                    }
                    · Por {{ todayLog.recordedByName }}
                  </p>
                }
              </div>
            } @else {
              <div class="pt-3 flex items-center justify-between text-[12px] text-blue-200/55">
                <span>Marcado como ausente en la sesión de hoy. Marca "✓ Vino a clase" para anotar qué hizo.</span>
              </div>
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class AssistantClassLogComponent implements OnInit {
  public readonly dojoApi = inject(DojoApiService);
  public readonly authSession = inject(AuthSessionService);

  public readonly filterMode = signal<AttendanceFilter>('TODOS');
  public readonly feedbackBanner = signal<string>('');
  public searchTerm: string = '';

  public readonly quickTags: ReadonlyArray<string> = [
    'Calentamiento y Ma Bu',
    'Taolu Changquan',
    'Defensa y Sanda',
    'Espada Jian Shu',
    'Flexibilidad y Patadas',
  ];

  public activityDrafts: Record<string, { techniques: string; observations: string }> = {};

  public readonly attendedCount = computed(
    () => this.dojoApi.students().filter((s) => s.isCurrentlyInClass).length
  );

  public readonly absentCount = computed(
    () => this.dojoApi.students().filter((s) => !s.isCurrentlyInClass).length
  );

  public readonly filteredStudents = computed(() => {
    const mode = this.filterMode();
    const term = this.searchTerm.trim().toLowerCase();

    return this.dojoApi.students().filter((s) => {
      if (mode === 'VINIERON' && !s.isCurrentlyInClass) return false;
      if (mode === 'NO_VINIERON' && s.isCurrentlyInClass) return false;
      if (!term) return true;
      const full = `${s.firstName} ${s.lastName} ${s.documentNumber}`.toLowerCase();
      return full.includes(term);
    });
  });

  public ngOnInit(): void {
    this.syncDraftsFromLogs();
  }

  private syncDraftsFromLogs(): void {
    for (const student of this.dojoApi.students()) {
      const log = this.dojoApi.getTodayLogForStudent(student.id);
      this.activityDrafts[student.id] = {
        techniques: log?.techniquesPracticed || '',
        observations: log?.trainingObservations || '',
      };
    }
  }

  public updateDraftTechniques(studentId: string, value: string): void {
    const prev = this.activityDrafts[studentId] || { techniques: '', observations: '' };
    this.activityDrafts[studentId] = { ...prev, techniques: value };
  }

  public updateDraftObservations(studentId: string, value: string): void {
    const prev = this.activityDrafts[studentId] || { techniques: '', observations: '' };
    this.activityDrafts[studentId] = { ...prev, observations: value };
  }

  public appendQuickTag(studentId: string, tag: string): void {
    const current = this.activityDrafts[studentId]?.techniques || '';
    const updated = current ? `${current}, ${tag}` : tag;
    this.updateDraftTechniques(studentId, updated);
  }

  public setStudentAttendance(student: StudentFullRecord, attended: boolean): void {
    if (!this.activityDrafts[student.id]) {
      this.syncDraftsFromLogs();
    }
    const draft = this.activityDrafts[student.id] || { techniques: '', observations: '' };

    this.dojoApi.recordClassSessionActivity(
      {
        studentId: student.id,
        isCurrentlyInClass: attended,
        techniquesPracticed: draft.techniques,
        trainingObservations: draft.observations,
      },
      this.authSession.currentUser()
    );

    this.feedbackBanner.set(
      `${student.firstName} ${student.lastName}: marcado como "${attended ? 'Vino a clase' : 'No vino'}".`
    );
  }

  public saveStudentActivity(student: StudentFullRecord): void {
    const draft = this.activityDrafts[student.id] || { techniques: '', observations: '' };

    this.dojoApi.recordClassSessionActivity(
      {
        studentId: student.id,
        isCurrentlyInClass: true,
        techniquesPracticed: draft.techniques,
        trainingObservations: draft.observations,
      },
      this.authSession.currentUser()
    );

    this.feedbackBanner.set(
      `Actividad de clase guardada para ${student.firstName} ${student.lastName}.`
    );
  }
}
