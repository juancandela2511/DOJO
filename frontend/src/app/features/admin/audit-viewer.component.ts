/**
 * @file audit-viewer.component.ts
 * @description Visor en tiempo real de la Bitácora de Auditoría Inmutable (`audit_logs`)
 *              con estética "Moonlit Lotus Glass".
 */

import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DojoApiService } from '../../core/services/dojo-api.service';

@Component({
  selector: 'app-audit-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="lotus-glass-card p-6 sm:p-7">
      <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <span class="inline-block px-3 py-0.5 rounded-full bg-pink-300/15 border border-pink-300/30 text-pink-200 text-[11px] font-semibold mb-1.5">
            🛡️ Seguridad PostgreSQL · Trigger Inmutable Activo
          </span>
          <h3 class="text-[21px] font-semibold text-white">
            Bitácora de Auditoría Inmutable (audit_logs)
          </h3>
          <p class="text-blue-100/75 text-[13px] mt-0.5">
            Cada registro es inalterable. Muestra autor, rol, tabla modificada, fecha exacta y comparación de valores.
          </p>
        </div>

        <!-- Filtros por Rol -->
        <div class="inline-flex p-1.5 rounded-[14px] bg-[#050914]/80 border border-pink-200/15">
          @for (roleFilter of ['TODOS', 'ADMIN', 'AYUDANTE', 'ESTUDIANTE']; track roleFilter) {
            <button
              type="button"
              (click)="selectedRoleFilter.set(roleFilter)"
              [class]="
                selectedRoleFilter() === roleFilter
                  ? 'px-3.5 py-1.5 rounded-[10px] bg-gradient-to-r from-[#22325a] to-[#31254d] text-pink-100 border border-pink-300/30 text-[12px] font-semibold shadow-sm'
                  : 'px-3.5 py-1.5 rounded-[10px] text-blue-200/70 hover:text-white text-[12px] font-medium'
              "
            >
              {{ roleFilter }}
            </button>
          }
        </div>
      </div>

      <!-- Lista de eventos auditados -->
      <div class="space-y-3.5">
        @for (log of filteredLogs(); track log.id) {
          <div class="lotus-glass-subcard p-4 sm:p-5">
            <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div class="flex items-center gap-2.5">
                <span
                  class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
                  [ngClass]="{
                    'bg-pink-300/20 text-pink-200 border-pink-300/35': log.actorRole === 'ADMIN',
                    'bg-amber-400/20 text-amber-200 border-amber-300/35': log.actorRole === 'AYUDANTE',
                    'bg-blue-400/20 text-blue-200 border-blue-300/35': log.actorRole === 'ESTUDIANTE'
                  }"
                >
                  {{ log.actorRole }}
                </span>
                <span class="text-[14px] font-semibold text-white">
                  {{ log.actorFullName }}
                </span>
                <span class="text-[12px] text-blue-200/65">
                  · Tabla: <code class="text-pink-200 font-mono">{{ log.targetTable }}</code>
                </span>
              </div>

              <div class="flex items-center gap-3">
                <span class="text-[12px] font-semibold text-amber-300">
                  {{ log.action }}
                </span>
                <span class="text-[12px] text-blue-200/60 font-mono">
                  {{ log.createdAt }}
                </span>
              </div>
            </div>

            <p class="text-[13.5px] text-blue-100/85 mb-3">
              {{ log.description }}
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px] font-mono">
              <div class="p-3 rounded-[12px] bg-[#040710]/80 border border-white/10 text-blue-200/75 overflow-x-auto">
                <span class="block text-[10.5px] font-semibold text-blue-300/70 mb-1">
                  OLD_DATA (Valor Anterior):
                </span>
                {{ log.oldData ? (log.oldData | json) : 'null (Registro Nuevo)' }}
              </div>
              <div class="p-3 rounded-[12px] bg-[#040710]/80 border border-pink-200/20 text-pink-100 overflow-x-auto">
                <span class="block text-[10.5px] font-semibold text-pink-300 mb-1">
                  NEW_DATA (Valor Nuevo):
                </span>
                {{ log.newData | json }}
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class AuditViewerComponent {
  private readonly dojoApi = inject(DojoApiService);
  public readonly selectedRoleFilter = signal<string>('TODOS');

  public readonly filteredLogs = computed(() => {
    const filter = this.selectedRoleFilter();
    const all = this.dojoApi.auditLogs();
    if (filter === 'TODOS') return all;
    return all.filter((item) => item.actorRole === filter);
  });
}
