import { ref } from 'vue';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { StudentFullRecord } from '../types/dojo';
import { useDojoStore } from './useDojoStore';

// Coordenadas del Dojo (ajústalas con la ubicación exacta de tu sede)
export const DOJO_COORDS = {
  latitude: 4.6533,
  longitude: -74.0836,
  radiusMeters: 60,
};

const gpsStatus = ref<'INACTIVO' | 'BUSCANDO' | 'EN_DOJO' | 'FUERA_DOJO' | 'ERROR'>('INACTIVO');
const currentDistanceMeters = ref<number | null>(null);
const paymentReminderActive = ref(false);
let watchId: string | null = null;

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function useMobileNative() {
  const store = useDojoStore();

  /**
   * Programa notificación local cada 12 horas cuando quedan <= 5 días de mensualidad.
   */
  async function syncPaymentReminders(student: StudentFullRecord): Promise<void> {
    if (student.daysRemaining > 5) {
      paymentReminderActive.value = false;
      try {
        await LocalNotifications.cancel({ notifications: [{ id: 501 }, { id: 502 }] });
      } catch {
        // En navegador web sin Capacitor nativo se ignora silenciosamente
      }
      return;
    }

    paymentReminderActive.value = true;
    const title =
      student.daysRemaining > 0
        ? `Tu mensualidad vence en ${student.daysRemaining} días`
        : 'Tu mensualidad del Dojo está vencida';
    const body = 'Recuerda realizar el pago de tu mensualidad para mantener activo tu acceso al tatami.';

    try {
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== 'granted') return;

      const now = Date.now();
      const twelveHoursMs = 12 * 60 * 60 * 1000;

      await LocalNotifications.cancel({ notifications: [{ id: 501 }, { id: 502 }] });
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 501,
            title,
            body,
            schedule: { at: new Date(now + 5000), every: 'day' },
          },
          {
            id: 502,
            title,
            body,
            schedule: { at: new Date(now + twelveHoursMs), every: 'day' },
          },
        ],
      });
    } catch {
      // Fallback silencioso en modo web
    }
  }

  async function notifyInClass(): Promise<void> {
    try {
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== 'granted') return;
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 601,
            title: 'Estás en clase',
            body: 'Ubicación detectada en el Dojo. Tu asistencia quedó registrada automáticamente.',
            schedule: { at: new Date(Date.now() + 1000) },
          },
        ],
      });
    } catch {
      // Fallback silencioso en modo web
    }
  }

  /**
   * Inicia seguimiento GPS automático apenas el estudiante abre la app.
   */
  async function startAutoDojoGeofence(student: StudentFullRecord): Promise<void> {
    gpsStatus.value = 'BUSCANDO';

    const handleCoords = (lat: number, lon: number) => {
      const dist = haversineMeters(lat, lon, DOJO_COORDS.latitude, DOJO_COORDS.longitude);
      currentDistanceMeters.value = dist;
      store.gpsDistanceMeters.value = dist;

      if (dist <= DOJO_COORDS.radiusMeters) {
        gpsStatus.value = 'EN_DOJO';
        if (!student.isCurrentlyInClass) {
          store.recordClassSessionActivity({
            studentId: student.id,
            isCurrentlyInClass: true,
            techniquesPracticed: '',
            trainingObservations: `Asistencia automática GPS (${dist}m del Dojo).`,
            method: 'AUTO_GPS',
            distanceMeters: dist,
          });
          notifyInClass();
        }
      } else {
        gpsStatus.value = 'FUERA_DOJO';
      }
    };

    try {
      await Geolocation.requestPermissions();
      if (watchId) await Geolocation.clearWatch({ id: watchId });
      watchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 10000 },
        (pos) => {
          if (pos?.coords) handleCoords(pos.coords.latitude, pos.coords.longitude);
        }
      );
    } catch {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.watchPosition(
          (pos) => handleCoords(pos.coords.latitude, pos.coords.longitude),
          () => {
            gpsStatus.value = 'ERROR';
          },
          { enableHighAccuracy: true }
        );
      } else {
        gpsStatus.value = 'ERROR';
      }
    }
  }

  async function stopAutoDojoGeofence(): Promise<void> {
    if (watchId) {
      try {
        await Geolocation.clearWatch({ id: watchId });
      } catch {
        // ignore
      }
      watchId = null;
    }
  }

  return {
    gpsStatus,
    currentDistanceMeters,
    paymentReminderActive,
    syncPaymentReminders,
    startAutoDojoGeofence,
    stopAutoDojoGeofence,
  };
}
