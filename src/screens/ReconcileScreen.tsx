import React, { useState } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Upload, 
  FileText, 
  Calendar,
  Check,
  Info
} from 'lucide-react';
import { RECONCILIATION_LEDS } from '../data/mockData';

export const ReconcileScreen: React.FC = () => {
  const [selectedReason, setSelectedReason] = useState('present_issue');
  const [fileUploaded, setFileUploaded] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [eventDayBypass, setEventDayBypass] = useState(false);
  const [fixingClassId, setFixingClassId] = useState<string | null>('rec3');

  const handleFileUpload = () => {
    setFileUploaded('Attendance_Proof_Pass.pdf');
  };

  const handleSubmitCorrection = () => {
    setSubmitted(true);
  };

  const handleFestBypass = () => {
    setEventDayBypass(!eventDayBypass);
  };

  return (
    <div className="space-y-6 py-4">
      
      {/* Top Summary Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 stealth-card p-5">
        <div>
          <span className="text-[10px] font-mono text-[#6BD8CB] uppercase tracking-wider block mb-1 tnum">
            ATTENDANCE REVIEW
          </span>
          <h1 className="text-xl font-jakarta font-bold text-white">Today's Attendance Review</h1>
          <p className="text-xs text-[#94A3B8] mt-1 max-w-2xl font-sans">
            Check today's records and fix anything marked incorrectly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button 
            onClick={handleFestBypass}
            className={`btn-stealth px-3 py-2 text-xs font-mono flex items-center space-x-2 transition-colors ${
              eventDayBypass ? 'border-[#10B981] text-[#10B981] bg-[#10B981]/10' : ''
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span className="tnum">{eventDayBypass ? 'Day Flagged as Event Day ✓' : 'Mark Day as Fest / Event'}</span>
          </button>

          <div className="bg-[#161F30] border border-[#233044] px-3 py-2 rounded text-xs font-mono text-[#94A3B8] flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span className="tnum">You can fix records until 08:00 PM today</span>
          </div>
        </div>
      </div>

      {/* Top 3 Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stealth-card p-4 flex items-center space-x-3">
          <div className="w-9 h-9 rounded bg-[#161F30] border border-[#233044] flex items-center justify-center text-[#94A3B8]">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-[#64748B] uppercase">CLASSES TODAY</p>
            <p className="text-xl font-jakarta font-bold text-white tnum">04 <span className="text-xs text-[#94A3B8] font-mono font-normal">Total Classes</span></p>
          </div>
        </div>

        <div className="stealth-card p-4 flex items-center space-x-3">
          <div className="w-9 h-9 rounded bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center text-[#10B981]">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-[#64748B] uppercase">CONFIRMED PRESENT</p>
            <p className="text-xl font-jakarta font-bold text-white tnum">03 <span className="text-xs text-[#94A3B8] font-mono font-normal">Checked In</span></p>
          </div>
        </div>

        <div className="stealth-card p-4 flex items-center space-x-3">
          <div className="w-9 h-9 rounded bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-center text-[#EF4444]">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-[#64748B] uppercase">NEEDS YOUR ACTION</p>
            <p className="text-xl font-jakarta font-bold text-[#EF4444] tnum">01 <span className="text-xs text-[#94A3B8] font-mono font-normal">Flagged / Absent</span></p>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Class List (Left) & Fix Form (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Today's Class List */}
        <div className="lg:col-span-6 stealth-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#233044]">
            <div>
              <h3 className="font-jakarta font-bold text-white text-base">Today's Class Records</h3>
              <p className="text-xs text-[#64748B] font-mono tnum">4 Classes Recorded</p>
            </div>
          </div>

          <div className="space-y-3">
            {RECONCILIATION_LEDS.map((rec) => {
              const isFlagged = rec.status === 'flagged';
              const isSelected = fixingClassId === rec.id;

              return (
                <div 
                  key={rec.id}
                  className={`p-4 rounded border flex items-center justify-between transition-colors ${
                    isFlagged && !submitted && !eventDayBypass
                      ? 'bg-[#EF4444]/10 border-[#EF4444]/40'
                      : rec.status === 'exempted' || eventDayBypass
                      ? 'bg-[#8B5CF6]/10 border-[#8B5CF6]/30'
                      : 'bg-[#161F30] border-[#233044]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-xs font-mono text-[#94A3B8] tnum">
                      <span>{rec.time}</span>
                      <span>•</span>
                      <span className="text-white font-bold">{rec.subjectCode}</span>
                    </div>
                    <h4 className="font-jakarta font-semibold text-white text-sm">{rec.subjectName}</h4>
                    <p className={`text-xs font-mono tnum ${
                      eventDayBypass
                        ? 'text-[#10B981] font-bold'
                        : isFlagged && !submitted
                        ? 'text-[#EF4444] font-bold'
                        : isFlagged && submitted
                        ? 'text-[#10B981]'
                        : 'text-[#94A3B8]'
                    }`}>
                      ● {eventDayBypass ? 'Fest / Event Day Override ✓' : isFlagged && submitted ? 'Correction Submitted ✓' : isFlagged ? 'Marked Absent / Check-in Issue' : rec.status === 'exempted' ? 'Free Period / Class Exempted' : 'Present • Auto-Checked'}
                    </p>
                  </div>

                  <div>
                    {rec.status === 'immutable' && (
                      <span className="bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] px-2.5 py-1 rounded text-xs font-mono flex items-center space-x-1 tnum">
                        <Check className="w-3 h-3 text-[#10B981]" />
                        <span>Confirmed</span>
                      </span>
                    )}
                    {rec.status === 'exempted' && (
                      <span className="bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#8B5CF6] px-2.5 py-1 rounded text-xs font-mono tnum">
                        Exempted
                      </span>
                    )}
                    {isFlagged && !submitted && !eventDayBypass && (
                      <button 
                        onClick={() => setFixingClassId(rec.id)}
                        className={`btn-primary px-3 py-1.5 text-xs font-mono ${isSelected ? 'ring-2 ring-[#6366F1]' : ''}`}
                      >
                        Fix This
                      </button>
                    )}
                    {isFlagged && (submitted || eventDayBypass) && (
                      <span className="bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] px-2.5 py-1 rounded text-xs font-mono tnum">
                        Confirmed ✓
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Simple Fix Form */}
        <div className="lg:col-span-6 stealth-card p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#233044]">
            <div>
              <span className="text-[10px] font-mono text-[#EF4444] uppercase tracking-wider font-bold">ATTENDANCE CORRECTION</span>
              <h3 className="text-base font-jakarta font-bold text-white">Computer Networks (CS602)</h3>
              <p className="text-xs font-mono text-[#64748B] tnum">Time Slot: 11:30 AM</p>
            </div>
            <span className="bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#EF4444] text-[10px] font-mono px-2.5 py-1 rounded font-bold uppercase tnum">
              Needs Review
            </span>
          </div>

          {/* One-Line Plain Language Explanation */}
          <div className="bg-[#161F30] border border-[#233044] rounded p-4 flex items-start space-x-3">
            <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
            <p className="text-xs text-[#DFE2F1] leading-relaxed font-sans">
              This class shows as absent, but you may have a valid reason.
            </p>
          </div>

          {/* Reason Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-[#94A3B8] uppercase block">What happened?</label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="input-stealth w-full font-sans text-xs py-2.5"
            >
              <option value="present_issue">I was present (technical / check-in issue)</option>
              <option value="event_day">College event / fest day</option>
              <option value="other_proof">Other, with proof</option>
            </select>
          </div>

          {/* Optional File Upload for Proof (Only when "Other, with proof" is selected) */}
          {selectedReason === 'other_proof' && (
            <div className="space-y-1.5 animate-fadeIn">
              <label className="text-[11px] font-mono text-[#94A3B8] uppercase block">Attach Proof Document (Optional)</label>
              <div 
                onClick={handleFileUpload}
                className="border border-dashed border-[#233044] hover:border-[#6366F1] bg-[#161F30] rounded p-4 text-center cursor-pointer transition-colors space-y-2"
              >
                <Upload className="w-5 h-5 mx-auto text-[#8B5CF6]" />
                {fileUploaded ? (
                  <p className="text-xs text-[#10B981] font-mono font-bold">✓ Attached: {fileUploaded}</p>
                ) : (
                  <>
                    <p className="text-xs text-[#DFE2F1] font-medium">Click to upload duty slip or medical pass</p>
                    <p className="text-[10px] text-[#64748B] font-mono">PDF, PNG, JPG up to 10MB</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleSubmitCorrection}
              disabled={submitted}
              className="btn-primary w-full py-2.5 text-xs font-mono uppercase font-bold"
            >
              {submitted ? '✓ Correction Submitted' : 'Submit Correction'}
            </button>
            <button
              onClick={() => {
                setSubmitted(false);
                setFileUploaded(null);
              }}
              className="btn-stealth w-full py-2 text-xs font-mono"
            >
              Cancel
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Info Note (One Simple Card) */}
      <div className="stealth-card p-4 flex items-start space-x-3 text-xs font-mono text-[#94A3B8]">
        <Info className="w-5 h-5 text-[#6BD8CB] shrink-0 mt-0.5" />
        <div>
          <h4 className="font-jakarta font-semibold text-white text-sm mb-1">Daily Review Deadline</h4>
          <p className="text-xs text-[#94A3B8] leading-relaxed font-sans">
            Records are finalized at the end of each day. If something looks wrong, fix it before then — after that, you'll need to contact your CR or faculty directly.
          </p>
        </div>
      </div>

    </div>
  );
};

