import { useState, useEffect, useMemo } from 'react';

export function parseTimeStrToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const cleaned = timeStr.trim();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  
  let hrs = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();
  
  if (period === 'PM' && hrs < 12) hrs += 12;
  if (period === 'AM' && hrs === 12) hrs = 0;
  return hrs * 60 + mins;
}

export function parseSlotTimeRange(slotTime: string): { startMins: number; endMins: number } | null {
  if (!slotTime) return null;
  const parts = slotTime.split('-').map(s => s.trim());
  if (parts.length < 2) return null;
  
  const startMins = parseTimeStrToMinutes(parts[0]);
  const endMins = parseTimeStrToMinutes(parts[1]);
  
  if (startMins === null || endMins === null) return null;
  return { startMins, endMins };
}

export interface ActiveLectureSlotHook {
  now: Date;
  currentTimeStr: string;
  activeSlot: any | null;
  isSlotActive: boolean;
  activeBadgeText: string;
}

export function useActiveLectureSlot(timetableSlots: any[]): ActiveLectureSlotHook {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000); // 10s precision ticker
    return () => clearInterval(timer);
  }, []);

  const currentTimeStr = useMemo(() => {
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }, [now]);

  const activeSlot = useMemo(() => {
    if (!timetableSlots || !Array.isArray(timetableSlots) || timetableSlots.length === 0) {
      return null;
    }

    const currentMins = now.getHours() * 60 + now.getMinutes();

    for (const slot of timetableSlots) {
      const timeStr = slot.time || slot.timeSlot || '';
      const range = parseSlotTimeRange(timeStr);
      if (range && currentMins >= range.startMins && currentMins <= range.endMins) {
        return slot;
      }
    }
    return null;
  }, [timetableSlots, now]);

  const isSlotActive = Boolean(activeSlot);

  const activeBadgeText = useMemo(() => {
    if (activeSlot) {
      const name = activeSlot.subjectName || activeSlot.subject || activeSlot.name || 'Class Lecture';
      const code = activeSlot.subjectCode || activeSlot.code || '';
      return `🟢 ACTIVE SLOT: ${name}${code ? ` (${code})` : ''}`;
    }
    return `🟡 OFF-PEAK / NO ACTIVE LECTURE`;
  }, [activeSlot]);

  return {
    now,
    currentTimeStr,
    activeSlot,
    isSlotActive,
    activeBadgeText
  };
}
