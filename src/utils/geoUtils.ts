/**
 * Calculates the Haversine distance in meters between two GPS coordinates.
 * 
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in meters (rounded to 1 decimal place)
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    return Infinity;
  }

  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round((R * c) * 10) / 10;
}

/**
 * Verifies if a student is within the campus geofence radius and returns attendance status.
 */
export function verifyGeofenceStatus(
  studentLat: number,
  studentLng: number,
  campusLat: number,
  campusLng: number,
  radiusMeters: number = 50
): { distanceMeters: number; isWithin: boolean; status: 'PRESENT' | 'ABSENT' } {
  const distanceMeters = calculateHaversineDistance(studentLat, studentLng, campusLat, campusLng);
  const isWithin = distanceMeters <= radiusMeters;
  return {
    distanceMeters,
    isWithin,
    status: isWithin ? 'PRESENT' : 'ABSENT'
  };
}

export interface StudentGeoVerificationInput {
  studentId: string;
  studentName: string;
  rollNumber: string;
  studentLat: number;
  studentLng: number;
}

export interface GeofenceAttendanceResult {
  studentId: string;
  studentName: string;
  rollNumber: string;
  calculatedDistanceMeters: number;
  maxAllowedRadiusMeters: number;
  status: 'PRESENT' | 'ABSENT';
  geofenceVerified: boolean;
  logMessage: string;
  firestorePayload: {
    studentId: string;
    studentName: string;
    rollNumber: string;
    status: 'PRESENT' | 'ABSENT';
    distanceMeters: number;
    geofenceVerified: boolean;
    reason?: string;
    timestamp: string;
  };
}

/**
 * Evaluates student GPS coordinates against classroom geofence center & radius
 * and generates the Firestore attendance log payload.
 */
export function checkGeofenceAndMarkAttendance(
  student: StudentGeoVerificationInput,
  campusLat: number = 29.380000,
  campusLng: number = 79.460000,
  maxAllowedRadiusMeters: number = 50
): GeofenceAttendanceResult {
  const distanceMeters = calculateHaversineDistance(student.studentLat, student.studentLng, campusLat, campusLng);
  const isWithin = distanceMeters <= maxAllowedRadiusMeters;
  const status: 'PRESENT' | 'ABSENT' = isWithin ? 'PRESENT' : 'ABSENT';

  const logMessage = isWithin
    ? `SUCCESS -> Attendance marked as "PRESENT" (Distance: ${distanceMeters}m ≤ ${maxAllowedRadiusMeters}m)`
    : `REJECTED -> Attendance marked as "ABSENT" with log "Location outside classroom geofence" (Distance: ${distanceMeters}m > ${maxAllowedRadiusMeters}m)`;

  const firestorePayload = {
    studentId: student.studentId,
    studentName: student.studentName,
    rollNumber: student.rollNumber,
    status,
    distanceMeters,
    geofenceVerified: isWithin,
    ...(isWithin ? {} : { reason: 'Location outside classroom geofence' }),
    timestamp: new Date().toISOString()
  };

  return {
    studentId: student.studentId,
    studentName: student.studentName,
    rollNumber: student.rollNumber,
    calculatedDistanceMeters: distanceMeters,
    maxAllowedRadiusMeters,
    status,
    geofenceVerified: isWithin,
    logMessage,
    firestorePayload
  };
}
