/**
 * @file geofence.util.ts
 * @description Cálculo geodésico exacto mediante la fórmula de Haversine para determinar
 *              si las coordenadas GPS enviadas por la App Android del estudiante se
 *              encuentran dentro del radio físico del Dojo.
 */

/**
 * Calcula la distancia en metros entre dos coordenadas GPS (Latitud/Longitud)
 * utilizando la fórmula esférica de Haversine.
 *
 * @param {number} lat1 Latitud del punto A (Estudiante Android).
 * @param {number} lon1 Longitud del punto A (Estudiante Android).
 * @param {number} lat2 Latitud del punto B (Centro del Tatami del Dojo).
 * @param {number} lon2 Longitud del punto B (Centro del Tatami del Dojo).
 * @returns {number} Distancia exacta en metros redondeada a 2 decimales.
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const EARTH_RADIUS_METERS = 6371000;
  const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((EARTH_RADIUS_METERS * c).toFixed(2));
}

/**
 * Obtiene los parámetros del Geofence del Dojo desde las variables de entorno.
 */
export function getDojoGeofenceParameters(): {
  dojoLatitude: number;
  dojoLongitude: number;
  radiusMeters: number;
  minDwellMinutes: number;
} {
  return {
    dojoLatitude: Number(process.env.DOJO_GPS_LATITUDE || 4.6533326),
    dojoLongitude: Number(process.env.DOJO_GPS_LONGITUDE || -74.083652),
    radiusMeters: Number(process.env.DOJO_GEOFENCE_RADIUS_METERS || 50),
    minDwellMinutes: Number(process.env.DOJO_MIN_DWELL_TIME_MINUTES || 15),
  };
}
