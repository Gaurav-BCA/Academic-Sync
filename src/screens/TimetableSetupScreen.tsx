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
import { TIMETABLE_MATRIX } from '../data/mockData';

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
      <div className="stealth-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center text-[#10B981]">
            <Sparkles className="w-4 h-4 animate-spin text-[#10B981]" />
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-[#10B981]">
              <span className="tnum font-semibold">AI Parsed from Syllabus OCR</span>
              <span>•</span>
              <span className="font-bold tnum">98.4% Confidence Score</span>
              <span>•</span>
              <span className="text-[#94A3B8]">Neural Vector Mapping</span>
            </div>
            <p className="text-[11px] font-mono text-[#64748B] mt-0.5 tnum">
              HASH: 9f8a_core_sync | PARSER: LLM-v4.2-STABLE
            </p>
          </div>
        </div>

        {/* Share Batch Code Pill */}
        <div className="flex items-center space-x-2 bg-[#161F30] border border-[#233044] rounded p-1.5 px-3 text-xs font-mono">
          <Share2 className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span className="text-[#94A3B8]">6-Digit Batch Code:</span>
          <span className="text-[#6BD8CB] font-bold text-sm tracking-wider tnum">#CS-8849</span>
          <button 
            onClick={handleCopyCode}
            className="p-1 hover:bg-[#1E293B] rounded text-[#94A3B8] hover:text-white transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          {copiedCode && <span className="text-[10px] text-[#10B981]">Copied!</span>}
        </div>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stealth-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono text-[#64748B] uppercase">OPERATIONAL CORE SYNCS</p>
            <div className="text-2xl font-jakarta font-bold text-white mt-1 tnum">24 <span className="text-xs text-[#94A3B8] font-normal font-mono">Weekly Lecture Slots</span></div>
            <p className="text-[11px] text-[#6BD8CB] font-mono mt-0.5 tnum">4.0 hrs/day mean synchronous density</p>
          </div>
          <div className="w-9 h-9 rounded bg-[#161F30] border border-[#233044] flex items-center justify-center text-[#94A3B8]">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="stealth-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono text-[#64748B] uppercase">HEAVY HARDWARE TELEMETRY</p>
            <div className="text-2xl font-jakarta font-bold text-white mt-1 tnum">6 <span className="text-xs text-[#94A3B8] font-normal font-mono">Intensive Labs</span></div>
            <p className="text-[11px] text-[#10B981] font-mono mt-0.5 tnum">120-min execution windows • Cyber & AI nodes</p>
          </div>
          <div className="w-9 h-9 rounded bg-[#161F30] border border-[#233044] flex items-center justify-center text-[#94A3B8]">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="stealth-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono text-[#64748B] uppercase">UNMONITORED LATENCY MARGINS</p>
            <div className="text-2xl font-jakarta font-bold text-white mt-1 tnum">4 <span className="text-xs text-[#94A3B8] font-normal font-mono">Free Study Windows</span></div>
            <p className="text-[11px] text-[#8B5CF6] font-mono mt-0.5 tnum">Self-directed buffer headroom available</p>
          </div>
          <div className="w-9 h-9 rounded bg-[#161F30] border border-[#233044] flex items-center justify-center text-[#94A3B8]">
            <Coffee className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Timetable Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 stealth-card rounded-b-none border-b-0 p-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-[#6366F1]" />
          <span className="font-jakarta font-bold text-white text-sm">Weekly Synchronous Telemetry Matrix</span>
          <span className="text-xs font-mono text-[#64748B] tnum">CYCLE: SEMESTER VI (SPRING 2025)</span>
        </div>

        <div className="flex items-center space-x-1 bg-[#161F30] p-1 rounded border border-[#233044]">
          <button 
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 rounded text-xs font-mono flex items-center space-x-1 ${viewMode === 'grid' ? 'bg-[#1E293B] text-white font-bold' : 'text-[#94A3B8]'}`}
          >
            <Grid className="w-3 h-3" />
            <span>Matrix Grid</span>
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded text-xs font-mono flex items-center space-x-1 ${viewMode === 'list' ? 'bg-[#1E293B] text-white font-bold' : 'text-[#94A3B8]'}`}
          >
            <List className="w-3 h-3" />
            <span>List View</span>
          </button>
          <button 
            onClick={() => setViewMode('audit')}
            className={`px-3 py-1 rounded text-xs font-mono flex items-center space-x-1 ${viewMode === 'audit' ? 'bg-[#1E293B] text-white font-bold' : 'text-[#94A3B8]'}`}
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
                  <p className="font-jakarta font-bold text-white text-sm">{day}</p>
                  <p className="text-[10px] font-mono text-[#64748B]">{daySubtitles[day]}</p>
                </div>

                {/* Day Slots */}
                {TIMETABLE_MATRIX.filter((s) => s.day === day).map((slot) => (
                  <div 
                    key={slot.id}
                    className={`stealth-card p-3 space-y-2 relative transition-all ${
                      slot.type === 'Laboratory'
                        ? 'border-[#8B5CF6]/40 bg-[#8B5CF6]/5'
                        : slot.type === 'Seminar'
                        ? 'border-[#0D9488]/40 bg-[#0D9488]/5'
                        : slot.type === 'Free'
                        ? 'border-[#233044] bg-[#161F30]/40 opacity-70'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                        slot.type === 'Laboratory'
                          ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]'
                          : slot.type === 'Seminar'
                          ? 'bg-[#0D9488]/20 text-[#6BD8CB]'
                          : 'bg-[#161F30] text-[#94A3B8]'
                      }`}>
                        {slot.type}
                      </span>
                      {slot.statusTag && (
                        <span className={`text-[9px] font-mono font-bold ${
                          slot.statusType === 'critical' ? 'text-[#EF4444]' : 'text-[#10B981]'
                        }`}>
                          {slot.statusTag}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-jakarta font-semibold text-white text-xs truncate">{slot.subjectName}</h4>
                      <p className="text-[10px] font-mono text-[#94A3B8] truncate">{slot.faculty || 'Unassigned'}</p>
                    </div>

                    <div className="pt-2 border-t border-[#233044] flex items-center justify-between text-[10px] font-mono text-[#64748B] tnum">
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
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#94A3B8]">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1]" />
            <span>Standard Sync Cycles</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
            <span>Heavy Telemetry Labs</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488]" />
            <span>Seminars / Colloquiums</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-xs font-mono text-[#10B981]">
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            <span className="tnum">Batch CS-VI-A: VERIFIED</span>
          </div>
          <button
            onClick={onConfirm}
            className="btn-primary px-4 py-2 text-xs font-mono uppercase flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Confirm & Generate Shareable Code</span>
          </button>
        </div>
      </div>
    </div>
  );
};
