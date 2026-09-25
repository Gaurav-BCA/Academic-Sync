import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Clock, 
  BookOpen, 
  UserCheck, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Copy, 
  Sparkles,
  Layers,
  AlertCircle
} from 'lucide-react';
import { db } from '../services/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface TimetableSlotItem {
  id: string;
  time: string;
  subject: string;
  subjectName?: string;
  code: string;
  subjectCode?: string;
  faculty: string;
  room: string;
  type: 'Lecture' | 'Laboratory' | 'Seminar' | 'Free';
}

export interface DayScheduleGroup {
  day: string;
  slots: TimetableSlotItem[];
}

interface EditTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  classCode: string;
  existingTimetable?: any[];
  onSaveSuccess?: (msg: string) => void;
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_SLOTS_SAMPLE: TimetableSlotItem[] = [
  {
    id: 'slot-1',
    time: '08:40 AM - 09:40 AM',
    subject: 'Database Management Systems',
    subjectName: 'Database Management Systems',
    code: 'BCA 516',
    subjectCode: 'BCA 516',
    faculty: 'Prof. S. Chakrabarti',
    room: 'LH-1',
    type: 'Lecture'
  },
  {
    id: 'slot-2',
    time: '09:40 AM - 10:40 AM',
    subject: 'Java Programming',
    subjectName: 'Java Programming',
    code: 'BCA 512',
    subjectCode: 'BCA 512',
    faculty: 'Dr. A. Sharma',
    room: 'LH-2',
    type: 'Lecture'
  },
  {
    id: 'slot-3',
    time: '10:50 AM - 11:50 AM',
    subject: 'Web Technologies Lab',
    subjectName: 'Web Technologies Lab',
    code: 'BCA 515',
    subjectCode: 'BCA 515',
    faculty: 'Prof. R. Verma',
    room: 'Lab 3',
    type: 'Laboratory'
  },
  {
    id: 'slot-4',
    time: '11:50 AM - 12:50 PM',
    subject: 'Software Engineering',
    subjectName: 'Software Engineering',
    code: 'BCA 514',
    subjectCode: 'BCA 514',
    faculty: 'Dr. M. Roy',
    room: 'LH-4',
    type: 'Lecture'
  }
];

export const EditTimetableModal: React.FC<EditTimetableModalProps> = ({
  isOpen,
  onClose,
  classCode,
  existingTimetable,
  onSaveSuccess
}) => {
  const [activeDay, setActiveDay] = useState<string>('Monday');
  const [timetableMap, setTimetableMap] = useState<Record<string, TimetableSlotItem[]>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copySuccessMsg, setCopySuccessMsg] = useState<string | null>(null);

  // Initialize day schedules from existing Firestore data or fallback defaults
  useEffect(() => {
    if (!isOpen) return;

    const initialMap: Record<string, TimetableSlotItem[]> = {};

    WEEKDAYS.forEach((day) => {
      initialMap[day] = [];
    });

    if (existingTimetable && Array.isArray(existingTimetable) && existingTimetable.length > 0) {
      // Case A: Structured array [{ day: 'Monday', slots: [...] }]
      const isStructured = existingTimetable.some((item: any) => item && item.day && Array.isArray(item.slots));

      if (isStructured) {
        existingTimetable.forEach((item: any) => {
          if (!item || !item.day) return;
          const dayName = WEEKDAYS.find(w => w.toLowerCase() === item.day.toLowerCase() || w.toLowerCase().startsWith(item.day.toLowerCase().slice(0, 3)));
          if (dayName && Array.isArray(item.slots)) {
            initialMap[dayName] = item.slots.map((s: any, idx: number) => ({
              id: s.id || `slot-${dayName}-${idx}-${Date.now()}`,
              time: s.time || s.timeSlot || '09:00 AM - 10:00 AM',
              subject: s.subject || s.subjectName || s.name || 'Class Subject',
              subjectName: s.subject || s.subjectName || s.name || 'Class Subject',
              code: s.code || s.subjectCode || s.statusTag || 'CS-501',
              subjectCode: s.code || s.subjectCode || s.statusTag || 'CS-501',
              faculty: s.faculty || s.instructor || 'Faculty Member',
              room: s.room || s.location || 'LH-1',
              type: (s.type as any) || 'Lecture'
            }));
          }
        });
      } else {
        // Case B: Flat slots array [{ day: 'Monday', time: '...', subject: '...' }]
        existingTimetable.forEach((s: any, idx: number) => {
          if (!s || !s.day) return;
          const dayName = WEEKDAYS.find(w => w.toLowerCase() === s.day.toLowerCase() || w.toLowerCase().startsWith(s.day.toLowerCase().slice(0, 3)));
          if (dayName) {
            initialMap[dayName].push({
              id: s.id || `slot-${dayName}-${idx}-${Date.now()}`,
              time: s.time || s.timeSlot || '09:00 AM - 10:00 AM',
              subject: s.subject || s.subjectName || s.name || 'Class Subject',
              subjectName: s.subject || s.subjectName || s.name || 'Class Subject',
              code: s.code || s.subjectCode || s.statusTag || 'CS-501',
              subjectCode: s.code || s.subjectCode || s.statusTag || 'CS-501',
              faculty: s.faculty || s.instructor || 'Faculty Member',
              room: s.room || s.location || 'LH-1',
              type: (s.type as any) || 'Lecture'
            });
          }
        });
      }
    }

    // Populate default samples for empty days to assist user onboarding
    WEEKDAYS.forEach((day) => {
      if (!initialMap[day] || initialMap[day].length === 0) {
        if (day === 'Saturday') {
          initialMap[day] = [
            {
              id: `slot-sat-1`,
              time: '09:00 AM - 11:00 AM',
              subject: 'Project Colloquium & Seminar',
              subjectName: 'Project Colloquium & Seminar',
              code: 'BCA 518',
              subjectCode: 'BCA 518',
              faculty: 'Prof. S. Chakrabarti',
              room: 'Seminar Hall 1',
              type: 'Seminar'
            }
          ];
        } else {
          initialMap[day] = DEFAULT_SLOTS_SAMPLE.map((s, idx) => ({
            ...s,
            id: `slot-${day}-${idx}-${Date.now()}`
          }));
        }
      }
    });

    setTimetableMap(initialMap);
    setErrorMessage(null);
  }, [isOpen, existingTimetable]);

  if (!isOpen) return null;

  const currentDaySlots = timetableMap[activeDay] || [];

  // Update specific field on a slot row
  const handleUpdateSlotField = (
    index: number,
    field: keyof TimetableSlotItem,
    value: string
  ) => {
    setTimetableMap((prev) => {
      const daySlots = [...(prev[activeDay] || [])];
      const targetSlot = { ...daySlots[index] };

      (targetSlot as any)[field] = value;
      if (field === 'subject') targetSlot.subjectName = value;
      if (field === 'code') targetSlot.subjectCode = value;

      daySlots[index] = targetSlot;
      return {
        ...prev,
        [activeDay]: daySlots
      };
    });
  };

  // Add a new blank slot to active day
  const handleAddSlot = () => {
    const newSlot: TimetableSlotItem = {
      id: `slot-${activeDay}-${Date.now()}`,
      time: '01:30 PM - 02:30 PM',
      subject: 'New Subject',
      subjectName: 'New Subject',
      code: 'BCA 517',
      subjectCode: 'BCA 517',
      faculty: 'Faculty Instructor',
      room: 'LH-1',
      type: 'Lecture'
    };

    setTimetableMap((prev) => ({
      ...prev,
      [activeDay]: [...(prev[activeDay] || []), newSlot]
    }));
  };

  // Delete a slot row from active day
  const handleRemoveSlot = (index: number) => {
    setTimetableMap((prev) => {
      const daySlots = [...(prev[activeDay] || [])];
      daySlots.splice(index, 1);
      return {
        ...prev,
        [activeDay]: daySlots
      };
    });
  };

  // Copy current active day routine to all other weekdays
  const handleDuplicateToWeekdays = () => {
    const templateSlots = timetableMap[activeDay] || [];
    setTimetableMap((prev) => {
      const updated = { ...prev };
      WEEKDAYS.forEach((day) => {
        if (day !== activeDay && day !== 'Saturday') {
          updated[day] = templateSlots.map((s, idx) => ({
            ...s,
            id: `slot-${day}-${idx}-${Date.now()}`
          }));
        }
      });
      return updated;
    });
    setCopySuccessMsg(`Copied ${activeDay}'s routine to all Mon–Fri weekdays!`);
    setTimeout(() => setCopySuccessMsg(null), 3000);
  };

  // Save to Firestore batches/{classCode}
  const handleSaveTimetable = async () => {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const structuredTimetable: DayScheduleGroup[] = WEEKDAYS.map((day) => ({
        day,
        slots: (timetableMap[day] || []).map((s, idx) => ({
          id: s.id || `slot-${day}-${idx}`,
          time: s.time.trim(),
          subject: s.subject.trim(),
          subjectName: s.subject.trim(),
          code: s.code.trim(),
          subjectCode: s.code.trim(),
          faculty: s.faculty.trim(),
          room: s.room.trim(),
          type: s.type
        }))
      }));

      // Extract unique subjects for batch subjects summary
      const uniqueSubjectsMap = new Map<string, any>();
      structuredTimetable.forEach((dayGroup) => {
        dayGroup.slots.forEach((s) => {
          if (s.code && !uniqueSubjectsMap.has(s.code)) {
            uniqueSubjectsMap.set(s.code, {
              code: s.code,
              name: s.subject,
              faculty: s.faculty,
              room: s.room
            });
          }
        });
      });
      const subjectsArray = Array.from(uniqueSubjectsMap.values());

      const batchDocRef = doc(db, 'batches', classCode);
      await setDoc(batchDocRef, {
        timetable: structuredTimetable,
        subjects: subjectsArray,
        updatedAt: serverTimestamp()
      }, { merge: true });

      const msg = "Timetable updated successfully! Real-time changes synced across all batch members.";
      if (onSaveSuccess) {
        onSaveSuccess(msg);
      }
      onClose();
    } catch (err: any) {
      console.error("Failed to save timetable to Firestore:", err);
      setErrorMessage(err.message || "Failed to update timetable in Firestore.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white border border-purple-200 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-800 text-white p-6 relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 bg-purple-500/30 border border-purple-400/40 px-3 py-1 rounded-full text-xs font-mono text-purple-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="font-bold uppercase">Batch: {classCode} • Timetable Editor</span>
            </div>
            <h2 className="text-2xl font-jakarta font-bold tracking-tight">Edit & Update Class Timetable</h2>
            <p className="text-xs text-purple-200 font-sans">
              Modify time slots, subject codes, faculty, and room numbers. Changes sync live across all enrolled students and teachers.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-purple-200 hover:text-white hover:bg-white/10 rounded-full transition-colors self-end sm:self-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Day Selector Tabs */}
        <div className="bg-purple-50/80 border-b border-purple-100 p-3 px-6 flex items-center justify-between gap-3 overflow-x-auto shrink-0">
          <div className="flex items-center space-x-2">
            {WEEKDAYS.map((day) => {
              const count = (timetableMap[day] || []).length;
              const isActive = activeDay === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setActiveDay(day)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-purple-700 text-white shadow-md shadow-purple-900/20'
                      : 'bg-white text-neutral-700 hover:bg-purple-100 border border-purple-200/70'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{day}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-purple-800 text-purple-100' : 'bg-purple-100 text-purple-800'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleDuplicateToWeekdays}
            title="Duplicate current day schedule to all weekdays (Mon-Fri)"
            className="px-3 py-2 bg-white hover:bg-purple-100 border border-purple-300 text-purple-900 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 shrink-0 transition-all"
          >
            <Copy className="w-3.5 h-3.5 text-purple-700" />
            <span className="hidden sm:inline">Copy to Mon–Fri</span>
          </button>
        </div>

        {/* Copy Success / Error Banner */}
        {copySuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-3 px-6 text-emerald-800 text-xs font-mono font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{copySuccessMsg}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-50 border-b border-rose-200 p-3 px-6 text-rose-800 text-xs font-mono font-bold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main Slot List Editor Section */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-neutral-50/50">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-jakarta font-bold text-neutral-900 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-purple-700" />
              <span>Routine Slots for {activeDay} ({currentDaySlots.length} Classes)</span>
            </h3>

            <button
              type="button"
              onClick={handleAddSlot}
              className="px-3.5 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-xl font-mono text-xs font-bold flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-purple-700" />
              <span>+ Add New Slot</span>
            </button>
          </div>

          {currentDaySlots.length === 0 ? (
            <div className="p-8 text-center bg-white border border-dashed border-purple-200 rounded-2xl space-y-3">
              <Clock className="w-8 h-8 text-purple-300 mx-auto" />
              <p className="text-sm font-mono text-neutral-600 font-bold">No class slots scheduled for {activeDay}.</p>
              <button
                type="button"
                onClick={handleAddSlot}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-mono font-bold inline-flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Class Slot</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {currentDaySlots.map((slot, index) => (
                <div
                  key={slot.id || `slot-${index}`}
                  className="bg-white border border-purple-200/90 hover:border-purple-300 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs transition-all"
                >
                  {/* Slot Header Bar */}
                  <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-mono font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-xs font-mono font-bold text-neutral-900 uppercase">
                        Slot #{index + 1}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Slot Type Selector */}
                      <select
                        value={slot.type || 'Lecture'}
                        onChange={(e) => handleUpdateSlotField(index, 'type', e.target.value as any)}
                        className="text-xs font-mono font-bold bg-purple-50 text-purple-900 border border-purple-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="Lecture">Lecture</option>
                        <option value="Laboratory">Laboratory</option>
                        <option value="Seminar">Seminar</option>
                        <option value="Free">Free Period</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(index)}
                        className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1.5 rounded-lg font-mono text-xs font-bold flex items-center space-x-1 transition-colors"
                        title="Remove this slot"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Input Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Time Slot */}
                    <div>
                      <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase block mb-1 flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-purple-600" />
                        <span>TIME SLOT *</span>
                      </label>
                      <input
                        type="text"
                        value={slot.time}
                        onChange={(e) => handleUpdateSlotField(index, 'time', e.target.value)}
                        placeholder="e.g. 08:40 AM - 09:40 AM"
                        className="w-full text-xs font-mono bg-neutral-50 border border-neutral-300 focus:border-purple-500 rounded-xl px-3 py-2 text-neutral-900 focus:outline-none"
                      />
                    </div>

                    {/* Subject Name */}
                    <div>
                      <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase block mb-1 flex items-center space-x-1">
                        <BookOpen className="w-3 h-3 text-purple-600" />
                        <span>SUBJECT NAME *</span>
                      </label>
                      <input
                        type="text"
                        value={slot.subject}
                        onChange={(e) => handleUpdateSlotField(index, 'subject', e.target.value)}
                        placeholder="e.g. Database Systems"
                        className="w-full text-xs font-sans font-bold bg-neutral-50 border border-neutral-300 focus:border-purple-500 rounded-xl px-3 py-2 text-neutral-900 focus:outline-none"
                      />
                    </div>

                    {/* Subject Code */}
                    <div>
                      <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase block mb-1 flex items-center space-x-1">
                        <Layers className="w-3 h-3 text-purple-600" />
                        <span>SUBJECT CODE *</span>
                      </label>
                      <input
                        type="text"
                        value={slot.code}
                        onChange={(e) => handleUpdateSlotField(index, 'code', e.target.value)}
                        placeholder="e.g. BCA 516"
                        className="w-full text-xs font-mono font-bold bg-neutral-50 border border-neutral-300 focus:border-purple-500 rounded-xl px-3 py-2 text-neutral-900 focus:outline-none uppercase"
                      />
                    </div>

                    {/* Faculty / Teacher */}
                    <div>
                      <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase block mb-1 flex items-center space-x-1">
                        <UserCheck className="w-3 h-3 text-purple-600" />
                        <span>ASSIGNED FACULTY</span>
                      </label>
                      <input
                        type="text"
                        value={slot.faculty}
                        onChange={(e) => handleUpdateSlotField(index, 'faculty', e.target.value)}
                        placeholder="e.g. Prof. S. Chakrabarti"
                        className="w-full text-xs font-sans bg-neutral-50 border border-neutral-300 focus:border-purple-500 rounded-xl px-3 py-2 text-neutral-900 focus:outline-none"
                      />
                    </div>

                    {/* Room / Location */}
                    <div>
                      <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase block mb-1 flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-purple-600" />
                        <span>ROOM / LAB LOCATION</span>
                      </label>
                      <input
                        type="text"
                        value={slot.room}
                        onChange={(e) => handleUpdateSlotField(index, 'room', e.target.value)}
                        placeholder="e.g. LH-1 or Lab 3"
                        className="w-full text-xs font-mono bg-neutral-50 border border-neutral-300 focus:border-purple-500 rounded-xl px-3 py-2 text-neutral-900 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className="p-4 px-6 bg-white border-t border-purple-100 flex items-center justify-between gap-4 shrink-0">
          <div className="hidden sm:flex items-center space-x-2 text-xs font-mono text-neutral-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Firestore Real-Time Batch Synchronization Active</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-mono font-bold transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveTimetable}
              disabled={isSaving}
              className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-xl text-xs font-mono uppercase font-bold flex items-center space-x-2 shadow-lg shadow-purple-900/20 transition-all"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Syncing to Batch...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>SAVE & SYNC TIMETABLE</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
