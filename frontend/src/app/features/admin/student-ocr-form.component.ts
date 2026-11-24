/**
 * @file student-ocr-form.component.ts
 * @description Componente Standalone para el Rol ADMIN con estética "Moonlit Lotus Glass":
 *              Módulo OCR de Autocompletado de Cédula (CC) y Certificado EPS + Registro.
 */

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DojoApiService } from '../../core/services/dojo-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { BloodType } from '../../core/models/dojo.models';

@Component({
  selector: 'app-student-ocr-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="lotus-glass-card p-6 sm:p-7">
      <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <span class="inline-block px-3 py-0.5 rounded-full bg-pink-300/15 border border-pink-300/30 text-pink-200 text-[11px] font-semibold mb-1.5">
            🌸 Escáner OCR · Autocompletado
          </span>
          <h3 class="text-[21px] font-semibold text-white">
            Registro de Nuevo Discípulo (Cédula + EPS)
          </h3>
          <p class="text-blue-100/75 text-[13px] mt-0.5">
            Sube una imagen de la Cédula o Certificado EPS para autocompletar documento, nombres, RH y entidad de salud.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <label class="lotus-primary-pill px-4 py-2 text-[13px] cursor-pointer inline-flex items-center gap-2">
            <span>📷 Subir Cédula / EPS</span>
            <input
              type="file"
              accept="image/*,.pdf"
              class="hidden"
              (change)="onFileSelectedForOcr($event)"
            />
          </label>
          <button
            type="button"
            (click)="triggerDemoOcrScan()"
            class="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-blue-100 text-[13px] font-medium transition"
          >
            ⚡ Autocompletar Demo OCR
          </button>
        </div>
      </div>

      @if (ocrBannerMessage()) {
        <div class="mb-6 p-4 lotus-glass-subcard flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <p class="text-[12px] font-semibold text-pink-200">
              ✓ Lectura OCR Completada (Confianza {{ ocrConfidence() }}%)
            </p>
            <p class="text-[12px] text-blue-100/80 font-mono mt-0.5">
              {{ ocrBannerMessage() }}
            </p>
          </div>
          <span class="text-[11px] text-blue-200/60">Verifica los datos antes de guardar</span>
        </div>
      }

      <form (ngSubmit)="saveNewStudent()" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-[12px] font-semibold text-pink-100/90 mb-1.5">
            Número de Cédula (CC) *
          </label>
          <input
            type="text"
            name="documentNumber"
            [(ngModel)]="form.documentNumber"
            required
            placeholder="Ej. 1098765432"
            class="lotus-glass-input w-full px-3.5 py-2.5 text-[14px]"
          />
        </div>

        <div>
          <label class="block text-[12px] font-semibold text-pink-100/90 mb-1.5">
            Nombres *
          </label>
          <input
            type="text"
            name="firstName"
            [(ngModel)]="form.firstName"
            required
            placeholder="Nombres del discípulo"
            class="lotus-glass-input w-full px-3.5 py-2.5 text-[14px]"
          />
        </div>

        <div>
          <label class="block text-[12px] font-semibold text-pink-100/90 mb-1.5">
            Apellidos *
          </label>
          <input
            type="text"
            name="lastName"
            [(ngModel)]="form.lastName"
            required
            placeholder="Apellidos del discípulo"
            class="lotus-glass-input w-full px-3.5 py-2.5 text-[14px]"
          />
        </div>

        <div>
          <label class="block text-[12px] font-semibold text-pink-100/90 mb-1.5">
            Grupo Sanguíneo y RH *
          </label>
          <select
            name="bloodType"
            [(ngModel)]="form.bloodType"
            class="lotus-glass-input w-full px-3.5 py-2.5 text-[14px]"
          >
            @for (rh of bloodTypes; track rh) {
              <option [value]="rh" class="bg-[#0a1020] text-white">{{ rh }}</option>
            }
          </select>
        </div>

        <div>
          <label class="block text-[12px] font-semibold text-pink-100/90 mb-1.5">
            Entidad EPS Vigente *
          </label>
          <input
            type="text"
            name="epsEntity"
            [(ngModel)]="form.epsEntity"
            required
            placeholder="Ej. EPS Sura / Sanitas"
            class="lotus-glass-input w-full px-3.5 py-2.5 text-[14px]"
          />
        </div>

        <div>
          <label class="block text-[12px] font-semibold text-pink-100/90 mb-1.5">
            Cinturón / Faja Inicial *
          </label>
          <select
            name="currentBeltId"
            [(ngModel)]="form.currentBeltId"
            class="lotus-glass-input w-full px-3.5 py-2.5 text-[14px]"
          >
            @for (belt of dojoApi.belts(); track belt.id) {
              <option [ngValue]="belt.id" class="bg-[#0a1020] text-white">{{ belt.name }}</option>
            }
          </select>
        </div>

        <div>
          <label class="block text-[12px] font-semibold text-pink-100/90 mb-1.5">
            Teléfono Móvil
          </label>
          <input
            type="text"
            name="phone"
            [(ngModel)]="form.phone"
            placeholder="Ej. 3001234567"
            class="lotus-glass-input w-full px-3.5 py-2.5 text-[14px]"
          />
        </div>

        <div>
          <label class="block text-[12px] font-semibold text-pink-100/90 mb-1.5">
            Contacto de Emergencia *
          </label>
          <input
            type="text"
            name="emergencyContactName"
            [(ngModel)]="form.emergencyContactName"
            required
            placeholder="Nombre familiar / acudiente"
            class="lotus-glass-input w-full px-3.5 py-2.5 text-[14px]"
          />
        </div>

        <div>
          <label class="block text-[12px] font-semibold text-pink-100/90 mb-1.5">
            Teléfono de Emergencia *
          </label>
          <input
            type="text"
            name="emergencyContactPhone"
            [(ngModel)]="form.emergencyContactPhone"
            required
            placeholder="Ej. 3109876543"
            class="lotus-glass-input w-full px-3.5 py-2.5 text-[14px]"
          />
        </div>

        <div class="md:col-span-2">
          <label class="block text-[12px] font-semibold text-pink-100/90 mb-1.5">
            Observaciones Médicas
          </label>
          <input
            type="text"
            name="medicalNotes"
            [(ngModel)]="form.medicalNotes"
            placeholder="Alergias, lesiones previas o notas..."
            class="lotus-glass-input w-full px-3.5 py-2.5 text-[14px]"
          />
        </div>

        <div class="flex items-end">
          <button
            type="submit"
            class="w-full lotus-primary-pill py-2.5 px-5 text-[14px]"
          >
            Guardar Discípulo
          </button>
        </div>
      </form>
    </div>
  `,
})
export class StudentOcrFormComponent {
  public readonly dojoApi = inject(DojoApiService);
  private readonly authSession = inject(AuthSessionService);

  public readonly bloodTypes: ReadonlyArray<BloodType> = [
    'O+',
    'O-',
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
  ];

  public readonly ocrBannerMessage = signal<string>('');
  public readonly ocrConfidence = signal<number>(98.4);

  public form = {
    documentNumber: '',
    firstName: '',
    lastName: '',
    birthDate: '2000-03-19',
    bloodType: 'O+' as BloodType,
    epsEntity: '',
    phone: '3014455667',
    emergencyContactName: 'Elena Mendoza',
    emergencyContactPhone: '3147788990',
    emergencyContactRelationship: 'Madre',
    currentBeltId: 1,
    medicalNotes: '',
  };

  public onFileSelectedForOcr(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const fileName = file ? file.name : 'Cedula_EPS_Capturada.jpg';
    this.applyOcrExtraction(fileName, fileName);
  }

  public triggerDemoOcrScan(): void {
    const toggleHint = this.form.documentNumber === '1098765432' ? '1054' : '1098';
    this.applyOcrExtraction('Scan_CC_EPS.jpg', toggleHint);
  }

  private applyOcrExtraction(fileName: string, hint: string): void {
    const extracted = this.dojoApi.runOcrExtraction(fileName, hint);
    this.form.documentNumber = extracted.documentNumber;
    this.form.firstName = extracted.firstName;
    this.form.lastName = extracted.lastName;
    this.form.bloodType = extracted.bloodType;
    this.form.epsEntity = extracted.epsEntity;
    this.form.birthDate = extracted.birthDate;
    this.form.medicalNotes = `Documentos verificados por OCR (${fileName})`;

    this.ocrConfidence.set(extracted.confidence);
    this.ocrBannerMessage.set(extracted.rawText);
  }

  public saveNewStudent(): void {
    if (!this.form.documentNumber || !this.form.firstName || !this.form.lastName) {
      return;
    }

    this.dojoApi.createStudentWithOcr(this.form, this.authSession.currentUser());

    this.ocrBannerMessage.set(
      `✓ Discípulo ${this.form.firstName} ${this.form.lastName} registrado exitosamente (ya puede consultar con su cédula ${this.form.documentNumber}).`
    );
    this.form.documentNumber = '';
    this.form.firstName = '';
    this.form.lastName = '';
    this.form.epsEntity = '';
  }
}
