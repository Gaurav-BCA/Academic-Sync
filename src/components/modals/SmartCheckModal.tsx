import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck
} from 'lucide-react';

import { useApp } from '../../context/AppContext';

interface SmartCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmartCheckModal: React.FC<SmartCheckModalProps> = ({ isOpen, onClose }) => {
  const { submitCheckInVote, voteStats } = useApp();
  const [selectedVote, setSelectedVote] = useState<'yes' | 'no' | null>(null);

  if (!isOpen) return null;

  const totalResponded = voteStats?.totalResponded || 3;
  const yesVotes = voteStats?.yesVotes || 3;
  const confidencePct = Math.min(99.9, Number(((yesVotes / Math.max(1, totalResponded)) * 100).toFixed(1)));

  const handleVote = (vote: 'yes' | 'no') => {
    setSelectedVote(vote);
    submitCheckInVote(vote);
    setTimeout(() => {
      onClose();
      setSelectedVote(null);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-amber-950/20 backdrop-blur-md animate-fade-in">
      <div className="stealth-modal max-w-xl w-full p-7 space-y-5 relative overflow-hidden bg-white border border-amber-100 rounded-3xl shadow-2xl text-neutral-900">
        
        {/* Top edge pastel gradient indicator */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF6B4B] via-emerald-400 to-indigo-500" />

        {/* Top Header info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="radar-dot" />
            <span className="text-[11px] font-mono text-emerald-700 font-bold uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 tnum">
              GEO-FENCE LOCK ACTIVE / CS-601 DISTRIBUTED SYSTEMS
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-800 transition-colors p-1.5 rounded-full hover:bg-amber-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Location & Concludes Timer Pill */}
        <div className="bg-amber-50/60 border border-amber-200/70 rounded-2xl p-3.5 flex flex-wrap items-center justify-between text-xs font-mono text-neutral-700">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-[#FF6B4B]" />
            <span className="text-neutral-900 font-bold">LH-302</span>
            <span>•</span>
            <span className="font-medium">Dr. R. Sharma</span>
          </div>
          <div className="flex items-center space-x-1 text-indigo-700 font-bold bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
            <Clock className="w-3.5 h-3.5" />
            <span className="tnum">Concludes in 04:29</span>
          </div>
        </div>

        {/* Main Title Question */}
        <div className="space-y-1">
          <h2 className="text-2xl font-jakarta font-bold text-neutral-900">Did today's class lecture take place?</h2>
          <p className="text-xs text-neutral-600 font-sans">
            📍 GPS verification confirms location inside <span className="text-neutral-900 font-bold">Lecture Hall 302</span>.
          </p>
        </div>

        {/* Feedback Banner */}
        {selectedVote && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs font-mono flex items-center space-x-2 animate-fade-in shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">✓ Response recorded! Updating live class attendance log...</span>
          </div>
        )}

        {/* Voting Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          
          {/* YES Card */}
          <button
            onClick={() => handleVote('yes')}
            className={`p-4.5 rounded-2xl border text-left space-y-3 transition-all ${
              selectedVote === 'yes'
                ? 'bg-emerald-100/70 border-emerald-400 text-emerald-950 shadow-md'
                : 'bg-emerald-50/50 border-emerald-200/80 hover:bg-emerald-100/50 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="bg-emerald-200/80 border border-emerald-300 text-[10px] font-mono text-emerald-900 px-2.5 py-0.5 rounded-full font-bold tnum">
                VERIFIED
              </span>
            </div>
            <div>
              <h4 className="font-jakarta font-bold text-neutral-900 text-sm">YES — Lecture Conducted</h4>
              <p className="text-[11px] text-neutral-600 mt-1 leading-snug">
                Faculty delivered module. Attendance confirmed by class peers.
              </p>
            </div>
          </button>

          {/* NO Card */}
          <button
            onClick={() => handleVote('no')}
            className={`p-4.5 rounded-2xl border text-left space-y-3 transition-all ${
              selectedVote === 'no'
                ? 'bg-rose-100/70 border-rose-400 text-rose-950 shadow-md'
                : 'bg-rose-50/50 border-rose-200/80 hover:bg-rose-100/50 hover:border-rose-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700">
                <XCircle className="w-5 h-5" />
              </div>
              <span className="bg-rose-200/80 border border-rose-300 text-[10px] font-mono text-rose-900 px-2.5 py-0.5 rounded-full font-bold tnum">
                CANCELLED
              </span>
            </div>
            <div>
              <h4 className="font-jakarta font-bold text-neutral-900 text-sm">NO — Lecture Cancelled</h4>
              <p className="text-[11px] text-neutral-600 mt-1 leading-snug">
                Session was cancelled or teacher absent. Attendance preserved.
              </p>
            </div>
          </button>

        </div>

        {/* Quorum Progress Bar */}
        <div className="bg-amber-50/50 border border-amber-200/70 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-1.5">
                <div className="w-6 h-6 rounded-full bg-indigo-500 text-[10px] flex items-center justify-center text-white font-bold tnum border border-white">AR</div>
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-[10px] flex items-center justify-center text-white font-bold tnum border border-white">PS</div>
                <div className="w-6 h-6 rounded-full bg-[#FF6B4B] text-[10px] flex items-center justify-center text-white font-bold tnum border border-white">DC</div>
              </div>
              <div>
                <span className="text-neutral-900 font-bold tnum">{totalResponded} of 4 class peers responded</span>
                <p className="text-[10px] text-neutral-500 font-medium">Real-Time Firestore Peer Consensus Active</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-neutral-500 block uppercase font-bold">CONFIDENCE</span>
              <span className="text-emerald-700 font-bold text-sm tnum">{confidencePct}%</span>
            </div>
          </div>

          <div className="w-full h-2 bg-amber-100/80 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#FF6B4B] to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${confidencePct}%` }} />
          </div>
        </div>

        {/* Trust Notice */}
        <div className="flex items-start space-x-2 text-[11px] font-mono text-neutral-500 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
          <span>
            Location verification ensures check-in authenticity. Your data is used strictly for attendance verification.
          </span>
        </div>

        {/* Actions Footer */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono border-t border-amber-100">
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-900 font-semibold underline"
          >
            Cancel / Close
          </button>

          <div className="text-neutral-400 text-[10px] tnum font-semibold">
            Verification ID #7A49-01
          </div>
        </div>

      </div>
    </div>
  );
};
