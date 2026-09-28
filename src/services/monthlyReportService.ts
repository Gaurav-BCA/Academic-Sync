import { db } from './firebase';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { sendMonthlyGuardianEmail } from './emailService';

export interface MonthlyAttendanceStats {
  totalClasses: number;
  attendedClasses: number;
  attendancePercentage: number;
  standingZone: 'SAFE ZONE' | 'AT RISK / SHORTAGE';
  statusColor: 'green' | 'red';
}

/**
 * Calculates monthly attendance statistics for a given student in a specific batch cohort.
 */
export async function calculateMonthlyAttendance(
  studentUid: string,
  classCode: string,
  month: string = 'September',
  year: number = 2026
): Promise<MonthlyAttendanceStats> {
  let studentLogs: any[] = [];
  try {
    const logsRef = collection(db, `batches/${classCode}/attendanceLogs`);
    const logsSnap = await getDocs(query(logsRef, where('studentUid', '==', studentUid)));

    if (!logsSnap.empty) {
      logsSnap.forEach(docSnap => studentLogs.push(docSnap.data()));
    } else {
      const allLogsSnap = await getDocs(logsRef);
      allLogsSnap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.studentUid === studentUid || data.studentId === studentUid || data.rollNumber === studentUid) {
          studentLogs.push(data);
        }
      });
    }
  } catch (err) {
    console.warn("Notice querying attendance logs for monthly report:", err);
  }

  let conductedSessionsCount = 0;
  try {
    const sessionsRef = collection(db, 'classSessions');
    const sessionsSnap = await getDocs(query(sessionsRef, where('batchId', '==', classCode)));
    conductedSessionsCount = sessionsSnap.size;
  } catch (err) {
    console.warn("Notice querying classSessions for monthly report:", err);
  }

  const totalClasses = Math.max(studentLogs.length, conductedSessionsCount);
  const attendedClasses = studentLogs.filter(l => 
    l.status === 'PRESENT' || l.status === 'Present' || l.status === 'present'
  ).length;

  const attendancePercentage = totalClasses > 0 
    ? Number(((attendedClasses / totalClasses) * 100).toFixed(1))
    : 0.0;

  const standingZone = attendancePercentage >= 75.0 ? 'SAFE ZONE' : 'AT RISK / SHORTAGE';
  const statusColor = attendancePercentage >= 75.0 ? 'green' : 'red';

  return {
    totalClasses,
    attendedClasses,
    attendancePercentage,
    standingZone,
    statusColor
  };
}

/**
 * Iterates through all enrolled students in an active batch code, computes their monthly
 * attendance telemetry, sends standard HTML emails via Resend REST API, and writes report documents
 * directly to Firestore `monthlyReports`.
 */
export async function generateAndDispatchMonthlyGuardianReports(
  classCode: string,
  month: string = 'September',
  year: number = 2026
): Promise<{ count: number; reports: any[] }> {
  const usersRef = collection(db, 'users');
  const studentsSnap = await getDocs(query(usersRef, where('classCode', '==', classCode), where('role', '==', 'student')));

  const studentsList: any[] = [];
  studentsSnap.forEach(docSnap => {
    studentsList.push({ id: docSnap.id, ...docSnap.data() });
  });

  const generatedReports: any[] = [];

  for (const student of studentsList) {
    const studentUid = student.id;
    const studentName = student.fullName || student.name || 'Student';
    const rollNumber = student.rollNumber || 'N/A';
    const guardianEmail = (student.guardianEmail || student.parentEmail || `${rollNumber.toLowerCase()}@guardian.edu`).toLowerCase();

    const stats = await calculateMonthlyAttendance(studentUid, classCode, month, year);

    // Send email report via Resend API
    const emailResult = await sendMonthlyGuardianEmail({
      guardianEmail,
      studentName,
      rollNumber,
      classCode,
      totalClasses: stats.totalClasses,
      attendedClasses: stats.attendedClasses,
      attendancePercentage: stats.attendancePercentage,
      standingZone: stats.standingZone
    });

    const reportId = `${studentUid}_${month}_${year}`;
    const reportData = {
      reportId,
      studentUid,
      studentName,
      rollNumber,
      classCode,
      guardianEmail,
      month,
      year,
      totalClasses: stats.totalClasses,
      attendedClasses: stats.attendedClasses,
      attendancePercentage: stats.attendancePercentage,
      standingZone: stats.standingZone,
      resendEmailId: emailResult.data?.id || null,
      resendSuccess: emailResult.success,
      resendError: emailResult.error || null,
      generatedAt: serverTimestamp(),
      status: emailResult.success ? 'sent_via_resend' : 'queued_for_email'
    };

    await setDoc(doc(db, 'monthlyReports', reportId), reportData, { merge: true });
    generatedReports.push(reportData);
  }

  return {
    count: generatedReports.length,
    reports: generatedReports
  };
}
