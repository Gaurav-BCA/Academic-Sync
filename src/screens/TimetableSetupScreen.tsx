import React, { useState } from 'react';
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
import { TIMETABLE_MATRIX, TimetableSlot } from '../data/mockData';

interface TimetableSetupScreenProps {
  onConfirm: () => void;
}

export const TimetableSetupScreen: React.FC<TimetableSetupScreenProps> = ({ onConfirm }) => {
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

  return (
    <div className="space-y-6 py-4">
      {/* Top AI Parser Header Banner */}
      <div className="bg-[#121722] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-4 h-4 animate-spin" />
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400">
              <span>AI Parsed from Syllabus OCR</span>
              <span>•</span>
              <span className="font-bold">98.4% Confidence Score</span>
              <span>•</span>
              <span className="text-slate-400">Neural Vector Mapping</span>
            </div>
            <p className="text-[11px] font-mono text-slate-500 mt-0.5">
              HASH: 9f8a_core_sync | PARSER: LLM-v4.2-STABLE
            </p>
          </div>
        </div>

        {/* Share Batch Code Pill */}
        <div className="flex items-center space-x-2 bg-[#0B0E14] border border-slate-800 rounded-xl p-1.5 px-3 text-xs font-mono">
          <Share2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Share 6-Digit Batch Code:</span>
          <span className="text-cyan-400 font-bold text-sm tracking-wider">#CS-8849</span>
          <button 
            onClick={handleCopyCode}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          {copiedCode && <span className="text-[10px] text-emerald-400">Copied!</span>}
        </div>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121722] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono text-slate-500 uppercase">OPERATIONAL CORE SYNCS</p>
            <div className="text-2xl font-bold font-mono text-white mt-1">24 <span className="text-xs text-slate-400 font-normal">Weekly Lecture Slots</span></div>
            <p className="text-[11px] text-cyan-400 font-mono mt-0.5">4.0 hrs/day mean synchronous density</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#121722] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono text-slate-500 uppercase">HEAVY HARDWARE TELEMETRY</p>
            <div className="text-2xl font-bold font-mono text-white mt-1">6 <span className="text-xs text-slate-400 font-normal">Intensive Labs</span></div>
            <p className="text-[11px] text-emerald-400 font-mono mt-0.5">120-min execution windows • Cyber & AI nodes</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#121722] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono text-slate-500 uppercase">UNMONITORED LATENCY MARGINS</p>
            <div className="text-2xl font-bold font-mono text-white mt-1">4 <span className="text-xs text-slate-400 font-normal">Free Study Windows</span></div>
            <p className="text-[11px] text-purple-400 font-mono mt-0.5">Self-directed buffer headroom available</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
            <Coffee className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Timetable Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121722] border border-slate-800 rounded-t-xl p-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white text-sm">Weekly Synchronous Matrix</span>
          <span className="text-xs font-mono text-slate-500">CYCLE: SEMESTER VI (SPRING 2025)</span>
        </div>

        <div className="flex items-center space-x-1 bg-[#0B0E14] p-1 rounded-lg border border-slate-800">
          <button 
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 rounded text-xs font-mono flex items-center space-x-1 ${viewMode === 'grid' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}
          >
            <Grid className="w-3 h-3" />
            <span>Matrix Grid</span>
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded text-xs font-mono flex items-center space-x-1 ${viewMode === 'list' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}
          >
            <List className="w-3 h-3" />
            <span>List View</span>
          </button>
          <button 
            onClick={() => setViewMode('audit')}
            className={`px-3 py-1 rounded text-xs font-mono flex items-center space-x-1 ${viewMode === 'audit' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}
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
                <div className="bg-[#121722] border border-slate-800 rounded-lg p-3 text-center">
                  <p className="font-bold text-white text-sm">{day}</p>
                  <p className="text-[10px] font-mono text-slate-500">{daySubtitles[day]}</p>
                </div>

                {/* Day Slots */}
                {TIMETABLE_MATRIX.filter((s) => s.day === day).map((slot) => (
                  <div 
                    key={slot.id}
                    className={`bg-[#121722] border rounded-xl p-3 space-y-2 relative transition-all hover:border-slate-600 ${
                      slot.type === 'Laboratory'
                        ? 'border-purple-900/40 bg-purple-950/10'
                        : slot.type === 'Seminar'
                        ? 'border-cyan-900/40 bg-cyan-950/10'
                        : slot.type === 'Free'
                        ? 'border-slate-800/40 bg-slate-950/40 opacity-70'
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                        slot.type === 'Laboratory'
                          ? 'bg-purple-900/60 text-purple-300'
                          : slot.type === 'Seminar'
                          ? 'bg-cyan-900/60 text-cyan-300'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {slot.type}
                      </span>
                      {slot.statusTag && (
                        <span className={`text-[9px] font-mono font-bold ${
                          slot.statusType === 'critical' ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {slot.statusTag}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-white text-xs truncate">{slot.subjectName}</h4>
                      <p className="text-[10px] text-slate-400 truncate">{slot.faculty || 'Unassigned'}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
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
      <div className="bg-[#121722] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>Lectures (Standard Class)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span>Laboratory (2-Hour Heavy)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span>Seminars / Colloquiums</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Batch CS-VI-A: VERIFIED</span>
          </div>
          <button
            onClick={onConfirm}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 text-xs font-mono flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Confirm & Generate Shareable Code</span>
          </button>
        </div>
      </div>
    </div>
  );
};
