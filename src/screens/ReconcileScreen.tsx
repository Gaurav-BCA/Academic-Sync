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
import { useApp } from '../context/AppContext';

export const ReconcileScreen: React.FC = () => {
  const { 
    reconciliationRecords, 
    submittedCorrectionIds, 
    submitCorrection, 
    eventDayBypass, 
    toggleEventDayBypass 
  } = useApp();

  const [selectedReason, setSelectedReason] = useState('present_issue');
  const [fileUploaded, setFileUploaded] = useState<string | null>(null);
  const [fixingClassId, setFixingClassId] = useState<string>('rec3');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fixingClass = reconciliationRecords.find(r => r.id === fixingClassId) || reconciliationRecords[2] || reconciliationRecords[0];
  const isFixingClassSubmitted = submittedCorrectionIds.includes(fixingClass.id);

  // Dynamic counter for unhandled flagged items
  const needsActionCount = reconciliationRecords.filter(
    r => r.status === 'flagged' && !submittedCorrectionIds.includes(r.id) && !eventDayBypass
  ).length;

  const confirmedPresentCount = reconciliationRecords.filter(
    r => r.status === 'immutable' || (r.status === 'flagged' && (submittedCorrectionIds.includes(r.id) || eventDayBypass))
  ).length;

  const handleFileUpload = () => {
    setFileUploaded('Attendance_Duty_Pass.pdf');
  };

  const handleSubmitCorrection = () => {
    submitCorrection(fixingClass.id, selectedReason, fileUploaded);
    setToastMessage(`Correction request submitted for ${fixingClass.subjectName} (${fixingClass.subjectCode}).`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6 py-4 relative max-w-[1240px] mx-auto">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white font-mono text-xs px-5 py-3.5 rounded-2xl shadow-xl border border-emerald-500 flex items-center space-x-2.5 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-white" />
          <span className="font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Summary Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 stealth-card p-6 bg-white border border-amber-100 rounded-3xl shadow-sm">
        <div>
          <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold block w-max mb-1.5 tnum">
            ATTENDANCE REVIEW
          </span>
          <h1 className="text-2xl font-jakarta font-bold text-neutral-900">Today's Attendance Review</h1>
          <p className="text-xs text-neutral-600 mt-1 max-w-2xl font-sans">
            Check today's records and fix anything marked incorrectly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button 
            onClick={toggleEventDayBypass}
            className={`btn-stealth px-4 py-2 text-xs font-mono flex items-center space-x-2 transition-all shadow-xs ${
              eventDayBypass ? 'border-emerald-300 text-emerald-800 bg-emerald-100 font-bold' : ''
            }`}
          >
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span className="tnum">{eventDayBypass ? 'Day Flagged as Event Day ✓' : 'Mark Day as Fest / Event'}</span>
          </button>

          <div className="bg-amber-50 border border-amber-200/80 px-3.5 py-2 rounded-full text-xs font-mono text-amber-900 flex items-center space-x-2 font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span className="tnum">You can fix records until 08:00 PM today</span>
          </div>
        </div>
      </div>

      {/* Top 3 Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stealth-card p-5 bg-white border border-amber-100 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-neutral-500 uppercase font-bold">CLASSES TODAY</p>
            <p className="text-2xl font-jakarta font-bold text-neutral-900 tnum">
              {String(reconciliationRecords.length).padStart(2, '0')} <span className="text-xs text-neutral-500 font-mono font-normal">Total Classes</span>
            </p>
          </div>
        </div>

        <div className="stealth-card p-5 bg-white border border-amber-100 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-neutral-500 uppercase font-bold">CONFIRMED PRESENT</p>
            <p className="text-2xl font-jakarta font-bold text-emerald-700 tnum">
              {String(confirmedPresentCount).padStart(2, '0')} <span className="text-xs text-neutral-500 font-mono font-normal">Checked In</span>
            </p>
          </div>
        </div>

        <div className="stealth-card p-5 bg-white border border-amber-100 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-neutral-500 uppercase font-bold">NEEDS YOUR ACTION</p>
            <p className="text-2xl font-jakarta font-bold text-rose-600 tnum">
              {String(needsActionCount).padStart(2, '0')} <span className="text-xs text-neutral-500 font-mono font-normal">Flagged / Absent</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Class List (Left) & Fix Form (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Today's Class List */}
        <div className="lg:col-span-6 stealth-card p-6 space-y-4 bg-white border border-amber-100 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-amber-100">
            <div>
              <h3 className="font-jakarta font-bold text-neutral-900 text-base">Today's Class Records</h3>
              <p className="text-xs text-neutral-500 font-mono tnum font-semibold">{reconciliationRecords.length} Classes Recorded</p>
            </div>
          </div>

          <div className="space-y-3">
            {reconciliationRecords.map((rec) => {
              const isFlagged = rec.status === 'flagged';
              const isSubmitted = submittedCorrectionIds.includes(rec.id);
              const isSelected = fixingClassId === rec.id;

              return (
                <div 
                  key={rec.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                    isFlagged && !isSubmitted && !eventDayBypass
                      ? 'bg-rose-50/70 border-rose-200'
                      : rec.status === 'exempted' || eventDayBypass
                      ? 'bg-purple-50/60 border-purple-200'
                      : 'bg-white border-amber-100 shadow-xs'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-xs font-mono text-neutral-500 tnum">
                      <span className="font-bold">{rec.time}</span>
                      <span>•</span>
                      <span className="text-neutral-900 font-bold">{rec.subjectCode}</span>
                    </div>
                    <h4 className="font-jakarta font-bold text-neutral-900 text-sm">{rec.subjectName}</h4>
                    <p className={`text-xs font-mono tnum ${
                      eventDayBypass
                        ? 'text-emerald-700 font-bold'
                        : isFlagged && !isSubmitted
                        ? 'text-rose-600 font-bold'
                        : isFlagged && isSubmitted
                        ? 'text-emerald-700 font-bold'
                        : 'text-neutral-500'
                    }`}>
                      ● {eventDayBypass ? 'Fest / Event Day Override ✓' : isFlagged && isSubmitted ? 'Correction Submitted ✓' : isFlagged ? 'Marked Absent / Check-in Issue' : rec.status === 'exempted' ? 'Free Period / Class Exempted' : 'Present • Auto-Checked'}
                    </p>
                  </div>

                  <div>
                    {rec.status === 'immutable' && (
                      <span className="bg-emerald-100 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-full text-xs font-mono flex items-center space-x-1 font-bold tnum">
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Confirmed</span>
                      </span>
                    )}
                    {rec.status === 'exempted' && (
                      <span className="bg-purple-100 border border-purple-200 text-purple-800 px-3 py-1 rounded-full text-xs font-mono font-bold tnum">
                        Exempted
                      </span>
                    )}
                    {isFlagged && !isSubmitted && !eventDayBypass && (
                      <button 
                        onClick={() => setFixingClassId(rec.id)}
                        className={`btn-primary px-4 py-1.5 text-xs font-mono font-bold ${isSelected ? 'ring-2 ring-orange-500' : ''}`}
                      >
                        Fix This
                      </button>
                    )}
                    {isFlagged && (isSubmitted || eventDayBypass) && (
                      <span className="bg-emerald-100 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-full text-xs font-mono font-bold tnum">
                        Correction Submitted ✓
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Dynamic Fix Form */}
        <div className="lg:col-span-6 stealth-card p-6 space-y-5 bg-white border border-amber-100 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-amber-100">
            <div>
              <span className="text-[10px] font-mono text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">ATTENDANCE CORRECTION</span>
              <h3 className="text-base font-jakarta font-bold text-neutral-900 mt-1">{fixingClass.subjectName} ({fixingClass.subjectCode})</h3>
              <p className="text-xs font-mono text-neutral-500 tnum mt-0.5">Time Slot: {fixingClass.time}</p>
            </div>
            <span className={`text-[10px] font-mono px-3 py-1 rounded-full font-bold uppercase tnum border ${
              isFixingClassSubmitted 
                ? 'bg-emerald-100 border-emerald-200 text-emerald-800' 
                : 'bg-rose-100 border-rose-200 text-rose-800'
            }`}>
              {isFixingClassSubmitted ? 'Correction Submitted' : 'Needs Review'}
            </span>
          </div>

          {/* One-Line Plain Language Explanation */}
          <div className="bg-amber-50/60 border border-amber-200/70 rounded-2xl p-4 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-neutral-800 leading-relaxed font-sans font-medium">
              {isFixingClassSubmitted 
                ? 'Your correction request has been submitted and is pending faculty verification.'
                : 'This class shows as absent or unverified, but you can submit a correction request below.'}
            </p>
          </div>

          {/* Reason Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-neutral-700 uppercase block font-semibold">What happened?</label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              disabled={isFixingClassSubmitted}
              className="input-stealth w-full font-sans text-xs py-2.5 bg-white border-amber-200 disabled:opacity-50"
            >
              <option value="present_issue">I was present (technical / check-in issue)</option>
              <option value="event_day">College event / fest day</option>
              <option value="other_proof">Other, with proof document</option>
            </select>
          </div>

          {/* Optional File Upload for Proof */}
          {selectedReason === 'other_proof' && (
            <div className="space-y-1.5 animate-fadeIn">
              <label className="text-[11px] font-mono text-neutral-700 uppercase block font-semibold">Attach Proof Document (Optional)</label>
              <div 
                onClick={handleFileUpload}
                className="border border-dashed border-amber-200 hover:border-[#FF6B4B] bg-amber-50/50 rounded-2xl p-4 text-center cursor-pointer transition-colors space-y-2"
              >
                <Upload className="w-5 h-5 mx-auto text-[#FF6B4B]" />
                {fileUploaded ? (
                  <p className="text-xs text-emerald-700 font-mono font-bold">✓ Attached: {fileUploaded}</p>
                ) : (
                  <>
                    <p className="text-xs text-neutral-800 font-semibold">Click to upload duty slip or medical pass</p>
                    <p className="text-[10px] text-neutral-500 font-mono">PDF, PNG, JPG up to 10MB</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleSubmitCorrection}
              disabled={isFixingClassSubmitted}
              className="btn-primary w-full py-3 text-xs font-mono uppercase font-bold disabled:opacity-50 shadow-md"
            >
              {isFixingClassSubmitted ? '✓ Correction Submitted' : 'Submit Correction'}
            </button>
            <button
              onClick={() => setFileUploaded(null)}
              className="btn-stealth w-full py-2.5 text-xs font-mono"
            >
              Reset Form
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Info Note (One Simple Card) */}
      <div className="stealth-card p-5 flex items-start space-x-3.5 text-xs font-mono text-neutral-600 bg-white border border-amber-100 rounded-2xl shadow-sm">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-jakarta font-bold text-neutral-900 text-sm mb-1">Daily Review Deadline</h4>
          <p className="text-xs text-neutral-600 leading-relaxed font-sans">
            Records are finalized at the end of each day. If something looks wrong, fix it before then — after that, you'll need to contact your Class Coordinator or faculty directly.
          </p>
        </div>
      </div>

    </div>
  );
};
