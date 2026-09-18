import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../context/OnboardingContext';
import { 
  Sparkles, 
  Share2, 
  Copy, 
  Clock, 
  Layers, 
  Coffee, 
  CheckCircle2, 
  Calendar, 
  Grid, 
  List, 
  FileText 
} from 'lucide-react';
import { TIMETABLE_MATRIX } from '../data/mockData';
import { db } from '../services/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export const TimetableSetupScreen: React.FC = () => {
  const navigate = useNavigate();
  const { completeOnboarding } = useOnboarding();
  const [copiedCode, setCopiedCode] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'audit'>('grid');

  const days: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat')[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daySubtitles: Record<string, string> = {
    Mon: 'Primary Core',
    Tue: 'Deep Execution',
    Wed: 'Systems Sync',
    Thu: 'Neural Pipeline',
    Fri: 'Cloud Infra',
    Sat: 'Synthetics/Colloq'
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText('#CS-8849');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleConfirmBatch = async () => {
    const classCode = 'CS-8849';
    try {
      await setDoc(doc(db, "batches", classCode), {
        classCode: classCode,
        institution: 'Apex Inst. of Tech',
        branch: 'Computer Science & Eng',
        term: 'Sem VI',
        timetable: TIMETABLE_MATRIX,
        createdAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn("Firestore batch setup warning:", err);
    }
    completeOnboarding('coordinator');
    navigate('/dashboard');
  };


  return (
    <div className="space-y-6 py-4">
      {/* Top AI Parser Header Banner */}
      <div className="stealth-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Sparkles className="w-4 h-4 animate-spin text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-emerald-700">
              <span className="tnum font-bold">AI Parsed from Syllabus OCR</span>
              <span>•</span>
              <span className="font-bold tnum">98.4% Confidence Score</span>
              <span>•</span>
              <span className="text-neutral-500">Neural Vector Mapping</span>
            </div>
            <p className="text-[11px] font-mono text-neutral-500 mt-0.5 tnum">
              HASH: 9f8a_core_sync | PARSER: LLM-v4.2-STABLE
            </p>
          </div>
        </div>

        {/* Share Batch Code Pill */}
        <div className="flex items-center space-x-2 bg-amber-50/80 border border-amber-200/80 rounded-full px-4 py-2 text-xs font-mono shadow-sm">
          <Share2 className="w-3.5 h-3.5 text-neutral-500" />
          <span className="text-neutral-600 font-medium">6-Digit Batch Code:</span>
          <span className="text-[#FF6B4B] font-bold text-sm tracking-wider tnum">#CS-8849</span>
          <button 
            onClick={handleCopyCode}
            className="p-1 hover:bg-amber-100 rounded-full text-neutral-500 hover:text-neutral-800 transition-colors ml-1"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          {copiedCode && <span className="text-[10px] text-emerald-700 font-bold">Copied!</span>}
        </div>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stealth-card p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">OPERATIONAL CORE SYNCS</p>
            <div className="text-3xl font-jakarta font-bold text-neutral-900 mt-1 tnum">24 <span className="text-xs text-neutral-500 font-normal font-mono">Weekly Lecture Slots</span></div>
            <p className="text-[11px] text-[#FF6B4B] font-mono mt-0.5 tnum font-semibold">4.0 hrs/day mean synchronous density</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF6B4B]">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="stealth-card p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">PRACTICAL LAB SESSIONS</p>
            <div className="text-3xl font-jakarta font-bold text-neutral-900 mt-1 tnum">6 <span className="text-xs text-neutral-500 font-normal font-mono">Intensive Labs</span></div>
            <p className="text-[11px] text-emerald-700 font-mono mt-0.5 tnum font-semibold">120-min lab sessions • CS & AI Labs</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="stealth-card p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">FREE STUDY WINDOWS</p>
            <div className="text-3xl font-jakarta font-bold text-neutral-900 mt-1 tnum">4 <span className="text-xs text-neutral-500 font-normal font-mono">Free Study Windows</span></div>
            <p className="text-[11px] text-indigo-600 font-mono mt-0.5 tnum font-semibold">Self-directed study windows available</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Coffee className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Timetable Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 stealth-card rounded-b-none border-b-0 p-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-[#FF6B4B]" />
          <span className="font-jakarta font-bold text-neutral-900 text-sm">Weekly Course Schedule</span>
          <span className="text-xs font-mono text-neutral-400 tnum">CYCLE: SEMESTER VI (SPRING 2025)</span>
        </div>

        <div className="flex items-center space-x-1 bg-amber-50/80 p-1 rounded-full border border-amber-200/80">
          <button 
            onClick={() => setViewMode('grid')}
            className={`px-3.5 py-1 rounded-full text-xs font-mono flex items-center space-x-1 transition-all ${
              viewMode === 'grid' ? 'bg-white text-[#FF6B4B] font-bold shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Grid className="w-3 h-3" />
            <span>Schedule Grid</span>
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`px-3.5 py-1 rounded-full text-xs font-mono flex items-center space-x-1 transition-all ${
              viewMode === 'list' ? 'bg-white text-[#FF6B4B] font-bold shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <List className="w-3 h-3" />
            <span>List View</span>
          </button>
          <button 
            onClick={() => setViewMode('audit')}
            className={`px-3.5 py-1 rounded-full text-xs font-mono flex items-center space-x-1 transition-all ${
              viewMode === 'audit' ? 'bg-white text-[#FF6B4B] font-bold shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-6 gap-3 min-w-[1000px]">
            {days.map((day) => (
              <div key={day} className="space-y-3">
                {/* Day Header */}
                <div className="stealth-card p-3 text-center">
                  <p className="font-jakarta font-bold text-neutral-900 text-sm">{day}</p>
                  <p className="text-[10px] font-mono text-neutral-400">{daySubtitles[day]}</p>
                </div>

                {/* Day Slots */}
                {TIMETABLE_MATRIX.filter((s) => s.day === day).map((slot) => (
                  <div 
                    key={slot.id}
                    className={`stealth-card p-3.5 space-y-2 relative transition-all ${
                      slot.type === 'Laboratory'
                        ? 'border-indigo-200 bg-indigo-50/40'
                        : slot.type === 'Seminar'
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : slot.type === 'Free'
                        ? 'border-stone-200 bg-stone-50/60 opacity-70'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        slot.type === 'Laboratory'
                          ? 'bg-indigo-100 text-indigo-700'
                          : slot.type === 'Seminar'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-200 text-stone-700'
                      }`}>
                        {slot.type}
                      </span>
                      {slot.statusTag && (
                        <span className={`text-[9px] font-mono font-bold ${
                          slot.statusType === 'critical' ? 'text-rose-600' : 'text-emerald-700'
                        }`}>
                          {slot.statusTag}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-jakarta font-bold text-neutral-900 text-xs truncate">{slot.subjectName}</h4>
                      <p className="text-[10px] font-mono text-neutral-500 truncate">{slot.faculty || 'Unassigned'}</p>
                    </div>

                    <div className="pt-2 border-t border-amber-100 flex items-center justify-between text-[10px] font-mono text-neutral-500 tnum">
                      <span>📍 {slot.room}</span>
                      <span>{slot.time.split(' ')[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend & Confirm Bottom Bar */}
      <div className="stealth-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-600">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B4B]" />
            <span>Standard Lectures</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span>Practical Lab Sessions</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Seminars / Colloquiums</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs font-mono text-emerald-700 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="tnum">Batch CS-VI-A: VERIFIED</span>
          </div>
          <button
            onClick={handleConfirmBatch}
            className="btn-primary px-5 py-2.5 text-xs font-bold uppercase rounded-full bg-[#FF6B4B] hover:bg-[#e05638] text-white shadow-md shadow-orange-500/20 flex items-center space-x-2 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Confirm & Generate Shareable Code</span>
          </button>
        </div>
      </div>
    </div>
  );
};



