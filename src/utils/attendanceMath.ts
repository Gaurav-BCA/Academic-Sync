import { StudentDetail } from '../data/manageStudentsData';

export interface CalculatedSubjectStats {
  subjectCode: string;
  subjectName: string;
  attended: number;
  total: number;
  percentage: number;
}

export interface CalculatedStudentStats {
  totalAttended: number;
  totalClasses: number;
  overallPercentage: number;
  subjects: CalculatedSubjectStats[];
}

/**
 * Single source of truth for attendance mathematical calculation.
 * Formula:
 * Subject Percentage = (Attended Classes / Total Conducted Classes) * 100
 * Overall Percentage = (Total Attended / Total Conducted) * 100
 * Single decimal precision: Math.round(val * 10) / 10 (e.g. 91.7%)
 */
export function calculateStudentAttendanceStats(student: StudentDetail): CalculatedStudentStats {
  if (!student || !student.subjects || student.subjects.length === 0) {
    return {
      totalAttended: 0,
      totalClasses: 0,
      overallPercentage: 100,
      subjects: []
    };
  }

  const calculatedSubjects: CalculatedSubjectStats[] = student.subjects.map((sub) => {
    const attended = Math.max(0, sub.attended);
    const total = Math.max(attended, sub.total);
    const percentage = total > 0 ? Math.round((attended / total) * 1000) / 10 : 100;

    return {
      subjectCode: sub.subjectCode,
      subjectName: sub.subjectName,
      attended,
      total,
      percentage
    };
  });

  const sumAttended = calculatedSubjects.reduce((acc, s) => acc + s.attended, 0);
  const sumTotal = calculatedSubjects.reduce((acc, s) => acc + s.total, 0);
  const overallPercentage = sumTotal > 0 ? Math.round((sumAttended / sumTotal) * 1000) / 10 : 100;

  return {
    totalAttended: sumAttended,
    totalClasses: sumTotal,
    overallPercentage,
    subjects: calculatedSubjects
  };
}
