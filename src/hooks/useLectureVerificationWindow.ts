import { useState, useEffect, useCallback } from 'react';

export interface ActiveVerificationWindow {
  isActive: boolean;
  slotId: string;
  subjectName: string;
  subjectCode: string;
  room: string;
  faculty: string;
  startTimeStr: string;
  endTimeStr: string;
  minutesRemaining: number;
  isDemo?: boolean;
}

/**
 * Parses time strings like "09:00 AM - 10:00 AM", "09:30 AM", "14:30"
 * into minutes from midnight (0 to 1439).
 */
function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const cleaned = timeStr.trim().toUpperCase();

  // Match 12-hour format: "09:30 AM" or "9:30PM"
  const twelveHourMatch = cleaned.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/);
  if (twelveHourMatch) {
    let hours = parseInt(twelveHourMatch[1], 10);
    const minutes = parseInt(twelveHourMatch[2], 10);
    const period = twelveHourMatch[3];
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // Match 24-hour format: "14:30"
  const twentyFourHourMatch = cleaned.match(/(\d{1,2}):(\d{2})/);
  if (twentyFourHourMatch) {
    const hours = parseInt(twentyFourHourMatch[1], 10);
    const minutes = parseInt(twentyFourHourMatch[2], 10);
    return hours * 60 + minutes;
  }

  return null;
}

/**
 * Custom hook that monitors today's batch timetable and triggers an attendance verification window
 * strictly during the LAST 10 MINUTES of any ongoing class lecture slot.
 * Triggers Web Notifications & Haptic Device Vibration.
 */
export function useLectureVerificationWindow(todayTimetable: any[]) {
  const [activeWindow, setActiveWindow] = useState<ActiveVerificationWindow | null>(null);
  const [demoOverride, setDemoOverride] = useState<ActiveVerificationWindow | null>(null);

  // Helper to trigger Web Notification & Vibration
  const triggerNotificationAndVibration = useCallback((subjectName: string, room: string) => {
    // 1. Device Vibration Haptic API
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch {
      // Vibration not supported on browser/device
    }

    // 2. Browser Web Notification API
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification("Attendance Verification Window is OPEN!", {
            body: `Verification for ${subjectName} (${room || 'Campus Class'}) is active. Submit your vote now!`,
            icon: '/favicon.ico',
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              new Notification("Attendance Verification Window is OPEN!", {
                body: `Verification for ${subjectName} (${room || 'Campus Class'}) is active. Submit your vote now!`,
                icon: '/favicon.ico',
              });
            }
          });
        }
      }
    } catch {
      // Notification API fallback
    }
  }, []);

  // Monitor timetable slot window continuously every 15 seconds
  useEffect(() => {
    const checkTimeWindow = () => {
      if (!todayTimetable || !Array.isArray(todayTimetable) || todayTimetable.length === 0) {
        setActiveWindow(null);
        return;
      }

      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      let foundActiveSlot: ActiveVerificationWindow | null = null;

      for (let i = 0; i < todayTimetable.length; i++) {
        const slot = todayTimetable[i];
        if (!slot) continue;

        let startMins: number | null = null;
        let endMins: number | null = null;

        const timeStr = slot.time || slot.timeRange || '';
        if (timeStr.includes('-')) {
          const parts = timeStr.split('-');
          startMins = parseTimeToMinutes(parts[0]);
          endMins = parseTimeToMinutes(parts[1]);
        } else {
          startMins = parseTimeToMinutes(slot.startTime || slot.time);
          endMins = parseTimeToMinutes(slot.endTime);
          // Fallback: If no explicit endTime provided, assume 1 hour duration
          if (startMins !== null && endMins === null) {
            endMins = startMins + 60;
          }
        }

        if (startMins !== null && endMins !== null && endMins > startMins) {
          // Check if current time is in the LAST 10 MINUTES of the slot (e.g., endMins - 10 <= currentMinutes <= endMins)
          const windowStartMins = endMins - 10;

          if (currentMinutes >= windowStartMins && currentMinutes <= endMins) {
            const minsLeft = Math.max(1, endMins - currentMinutes);
            const slotId = slot.id || slot.code || `slot-${i}`;
            const subjectName = slot.subject || slot.name || slot.subjectName || 'Current Lecture';
            const subjectCode = slot.code || slot.subjectCode || `CS-${100 + i}`;
            const room = slot.room || slot.location || 'LH-1';
            const faculty = slot.faculty || 'Course Instructor';

            foundActiveSlot = {
              isActive: true,
              slotId,
              subjectName,
              subjectCode,
              room,
              faculty,
              startTimeStr: slot.startTime || parts0(timeStr),
              endTimeStr: slot.endTime || parts1(timeStr),
              minutesRemaining: minsLeft
            };
            break;
          }
        }
      }

      if (foundActiveSlot && (!activeWindow || activeWindow.slotId !== foundActiveSlot.slotId)) {
        triggerNotificationAndVibration(foundActiveSlot.subjectName, foundActiveSlot.room);
      }

      setActiveWindow(foundActiveSlot);
    };

    checkTimeWindow();
    const interval = setInterval(checkTimeWindow, 15000); // Check every 15 sec
    return () => clearInterval(interval);
  }, [todayTimetable, activeWindow, triggerNotificationAndVibration]);

  // Demo / Test Override Trigger Helper
  const triggerDemoWindow = useCallback((customSubjectName?: string) => {
    const demoSlot: ActiveVerificationWindow = {
      isActive: true,
      slotId: `demo-slot-${Date.now()}`,
      subjectName: customSubjectName || 'CS601 Distributed Systems',
      subjectCode: 'CS-601',
      room: 'LH-302',
      faculty: 'Dr. R. Sharma',
      startTimeStr: '09:00 AM',
      endTimeStr: '10:00 AM',
      minutesRemaining: 10,
      isDemo: true
    };
    setDemoOverride(demoSlot);
    triggerNotificationAndVibration(demoSlot.subjectName, demoSlot.room);
  }, [triggerNotificationAndVibration]);

  const closeDemoWindow = useCallback(() => {
    setDemoOverride(null);
  }, []);

  const currentWindow = demoOverride || activeWindow;

  return {
    verificationWindow: currentWindow,
    isWindowActive: !!currentWindow?.isActive,
    triggerDemoWindow,
    closeDemoWindow
  };
}

function parts0(str: string): string {
  if (!str || !str.includes('-')) return '09:00 AM';
  return str.split('-')[0].trim();
}

function parts1(str: string): string {
  if (!str || !str.includes('-')) return '10:00 AM';
  return str.split('-')[1].trim();
}
