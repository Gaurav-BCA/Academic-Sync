import { sendMonthlyGuardianEmail } from '../src/services/emailService';

async function runTest() {
  console.log('====================================================');
  console.log(' 📧 RESEND EMAIL SERVICE INTEGRATION TEST');
  console.log('====================================================\n');

  const testPayload = {
    guardianEmail: 'delivered@resend.dev',
    studentName: 'Gaurav Dixit',
    rollNumber: '21CS045',
    classCode: 'CS-4151',
    totalClasses: 24,
    attendedClasses: 20,
    attendancePercentage: 83.3,
    standingZone: 'SAFE ZONE'
  };

  console.log('📋 Test Payload:', JSON.stringify(testPayload, null, 2));
  console.log('🚀 Sending request to Resend REST API (https://api.resend.com/emails)...\n');

  const result = await sendMonthlyGuardianEmail(testPayload);

  console.log('----------------------------------------------------');
  console.log('📌 RESPONSE RESULT:');
  console.log('----------------------------------------------------');
  console.log('Success Status:', result.success);
  console.log('Response Data:', JSON.stringify(result.data || result.error, null, 2));
  console.log('====================================================');
}

runTest().catch(console.error);
