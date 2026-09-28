import { checkGeofenceAndMarkAttendance, calculateHaversineDistance } from '../src/utils/geoUtils';

console.log('====================================================');
console.log(' GEOFENCING TEST SIMULATION - ACADEMIC-SYNC');
console.log('====================================================\n');

// 1. Classroom Geofence Center Settings
const campusLat = 29.380000;
const campusLng = 79.460000;
const maxAllowedRadius = 50; // meters

console.log('🎯 CLASSROOM GEOFENCE CENTER:');
console.log(`   Latitude: ${campusLat}`);
console.log(`   Longitude: ${campusLng}`);
console.log(`   Max Allowed Radius: ${maxAllowedRadius} meters\n`);

// 2. Student Coordinates
const studentA = {
  studentId: 'std_001',
  studentName: 'Student A (Within Geofence)',
  rollNumber: '21CS045',
  studentLat: 29.380080,
  studentLng: 79.460000
};

const studentB = {
  studentId: 'std_002',
  studentName: 'Student B (Outside Geofence)',
  rollNumber: '21CS049',
  studentLat: 29.380540,
  studentLng: 79.460000
};

// 3. Execution & Log Verification
console.log('----------------------------------------------------');
console.log('📌 SIMULATION 1: STUDENT A (10m Target Distance)');
console.log('----------------------------------------------------');
const resultA = checkGeofenceAndMarkAttendance(studentA, campusLat, campusLng, maxAllowedRadius);
console.log(`1. Calculated Haversine Distance: ${resultA.calculatedDistanceMeters} meters (Expected: ~8.9m)`);
console.log(`2. Geofence Verification Status: ${resultA.geofenceVerified ? 'PASS (≤ 50m)' : 'FAIL'}`);
console.log(`3. Outcome Log: ${resultA.logMessage}`);
console.log('4. Final Firestore Write Payload:');
console.log(JSON.stringify(resultA.firestorePayload, null, 2));
console.log('\n');

console.log('----------------------------------------------------');
console.log('📌 SIMULATION 2: STUDENT B (60m Target Distance)');
console.log('----------------------------------------------------');
const resultB = checkGeofenceAndMarkAttendance(studentB, campusLat, campusLng, maxAllowedRadius);
console.log(`1. Calculated Haversine Distance: ${resultB.calculatedDistanceMeters} meters (Expected: ~60.0m)`);
console.log(`2. Geofence Verification Status: ${resultB.geofenceVerified ? 'PASS' : 'FAIL (> 50m)'}`);
console.log(`3. Outcome Log: ${resultB.logMessage}`);
console.log('4. Final Firestore Write Payload:');
console.log(JSON.stringify(resultB.firestorePayload, null, 2));
console.log('\n');

console.log('====================================================');
console.log(' ✅ GEOFENCING TEST SIMULATION SUMMARY');
console.log('====================================================');
console.log(`• Student A (${studentA.rollNumber}): Distance ${resultA.calculatedDistanceMeters}m -> ${resultA.status} (Verified: ${resultA.geofenceVerified})`);
console.log(`• Student B (${studentB.rollNumber}): Distance ${resultB.calculatedDistanceMeters}m -> ${resultB.status} (Reason: ${resultB.firestorePayload.reason || 'None'})`);
