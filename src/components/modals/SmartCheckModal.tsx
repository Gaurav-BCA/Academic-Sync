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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="stealth-modal max-w-xl w-full p-6 space-y-5 relative overflow-hidden text-[#DFE2F1]">
        
        {/* Subtle top edge gradient indicator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#0D9488]" />

        {/* Top Header info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="radar-dot" />
            <span className="text-[11px] font-mono text-[#10B981] font-bold uppercase tracking-wider tnum">
              GEO-FENCE LOCK ACTIVE / CS-601 DISTRIBUTED SYSTEMS
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={onClose}
              className="text-[#94A3B8] hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Location & Concludes Timer Pill */}
        <div className="bg-[#161F30] border border-[#233044] rounded p-3 flex flex-wrap items-center justify-between text-xs font-mono text-[#94A3B8]">
          <div className="flex items-center space-x-2">
            <MapPin className="w-3.5 h-3.5 text-[#6BD8CB]" />
            <span className="text-white font-semibold">LH-302</span>
            <span>•</span>
            <span>Dr. R. Sharma</span>
          </div>
          <div className="flex items-center space-x-1 text-[#8B5CF6]">
            <Clock className="w-3.5 h-3.5" />
            <span className="tnum">Concludes in 04:29</span>
          </div>
        </div>

        {/* Main Title Question */}
        <div className="space-y-1">
          <h2 className="text-xl font-jakarta font-bold text-white">Did today's class lecture take place?</h2>
          <p className="text-xs text-[#94A3B8] font-sans">
            📍 GPS verification confirms location inside <span className="text-white font-semibold">Lecture Hall 302</span>.
          </p>
        </div>

        {/* Feedback Banner */}
        {selectedVote && (
          <div className="bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] p-3 rounded text-xs font-mono flex items-center space-x-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>✓ Response recorded! Updating live class attendance log...</span>
          </div>
        )}

        {/* Voting Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* YES Card */}
          <button
            onClick={() => handleVote('yes')}
            className={`p-4 rounded border text-left space-y-3 transition-colors ${
              selectedVote === 'yes'
                ? 'bg-[#10B981]/10 border-[#10B981] text-white'
                : 'bg-[#161F30] border-[#233044] hover:border-[#3E506B] hover:bg-[#1C1F2A]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="bg-[#10B981]/20 border border-[#10B981]/30 text-[10px] font-mono text-[#10B981] px-2 py-0.5 rounded tnum">
                VERIFIED
              </span>
            </div>
            <div>
              <h4 className="font-jakarta font-semibold text-white text-sm">YES — Lecture Conducted</h4>
              <p className="text-[11px] text-[#94A3B8] mt-1 leading-snug">
                Faculty delivered module. Attendance confirmed by class peers.
              </p>
            </div>
          </button>

          {/* NO Card */}
          <button
            onClick={() => handleVote('no')}
            className={`p-4 rounded border text-left space-y-3 transition-colors ${
              selectedVote === 'no'
                ? 'bg-[#EF4444]/10 border-[#EF4444] text-white'
                : 'bg-[#161F30] border-[#233044] hover:border-[#3E506B] hover:bg-[#1C1F2A]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded bg-[#EF4444]/20 border border-[#EF4444]/40 flex items-center justify-center text-[#EF4444]">
                <XCircle className="w-4 h-4" />
              </div>
              <span className="bg-[#EF4444]/20 border border-[#EF4444]/30 text-[10px] font-mono text-[#EF4444] px-2 py-0.5 rounded tnum">
                CANCELLED
              </span>
            </div>
            <div>
              <h4 className="font-jakarta font-semibold text-white text-sm">NO — Lecture Cancelled</h4>
              <p className="text-[11px] text-[#94A3B8] mt-1 leading-snug">
                Session was cancelled or teacher absent. Attendance preserved.
              </p>
            </div>
          </button>

        </div>

        {/* Quorum Progress Bar */}
        <div className="bg-[#161F30] border border-[#233044] rounded p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-1.5">
                <div className="w-5 h-5 rounded-full bg-[#6366F1] text-[9px] flex items-center justify-center text-white font-bold tnum">AR</div>
                <div className="w-5 h-5 rounded-full bg-[#0D9488] text-[9px] flex items-center justify-center text-white font-bold tnum">PS</div>
                <div className="w-5 h-5 rounded-full bg-[#8B5CF6] text-[9px] flex items-center justify-center text-white font-bold tnum">DC</div>
              </div>
              <div>
                <span className="text-white font-semibold tnum">{totalResponded} of 4 class peers responded</span>
                <p className="text-[10px] text-[#64748B]">Real-Time Firestore Peer Consensus Active</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-[#94A3B8] block uppercase">CONFIDENCE</span>
              <span className="text-[#10B981] font-bold text-sm tnum">{confidencePct}%</span>
            </div>
          </div>

          <div className="w-full h-1.5 bg-[#0F131D] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#6366F1] to-[#10B981] rounded-full transition-all duration-500" style={{ width: `${confidencePct}%` }} />
          </div>
        </div>


        {/* Trust Notice */}
        <div className="flex items-start space-x-2 text-[11px] font-mono text-[#94A3B8] leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-[#64748B] shrink-0 mt-0.5" />
          <span>
            Location verification ensures check-in authenticity. Your data is used strictly for attendance verification.
          </span>
        </div>

        {/* Actions Footer */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-white underline"
          >
            Cancel / Close
          </button>

          <div className="text-[#64748B] text-[10px] tnum">
            Verification ID #7A49-01
          </div>
        </div>

      </div>
    </div>
  );
};
