import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Radio, 
  Users 
} from 'lucide-react';

interface SmartCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmartCheckModal: React.FC<SmartCheckModalProps> = ({ isOpen, onClose }) => {
  const [selectedVote, setSelectedVote] = useState<'yes' | 'no' | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  if (!isOpen) return null;

  const handleVote = (vote: 'yes' | 'no') => {
    setSelectedVote(vote);
    setHasVoted(true);
    setTimeout(() => {
      // Auto dismiss after 2s confirmation
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121722] border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative overflow-hidden">
        
        {/* Glow accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-400" />

        {/* Top Header info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
              GEO-FENCE LOCK ACTIVE / CS-601 DISTRIBUTED SYSTEMS
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded-full">
              BAYES-TRUST 0.992
            </span>
            <button 
              onClick={onClose}
              className="text-slate-500 hover:text-slate-200 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Location & Concludes Timer Pill */}
        <div className="bg-[#0B0E14] border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center space-x-2">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-white font-bold">LH-302</span>
            <span>•</span>
            <span>Dr. R. Sharma</span>
          </div>
          <div className="flex items-center space-x-1 text-purple-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Concludes in 04:29</span>
          </div>
        </div>

        {/* Main Title Question */}
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-white">Did today's lecture happen?</h2>
          <p className="text-xs text-slate-400 font-sans">
            📍 GPS telemetry confirms you are currently inside <span className="text-white font-semibold">Lecture Hall 302</span> (-0.4m delta).
          </p>
        </div>

        {/* Voting Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* YES Card */}
          <button
            onClick={() => handleVote('yes')}
            className={`p-4 rounded-2xl border text-left space-y-3 transition-all ${
              selectedVote === 'yes'
                ? 'bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500/50'
                : 'bg-[#0B0E14] border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="bg-emerald-950 border border-emerald-800 text-[10px] font-mono text-emerald-300 px-2 py-0.5 rounded">
                SIG-ACK
              </span>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">YES — Conducted</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Faculty delivered lecture. Telemetry validated via quorum.
              </p>
            </div>
          </button>

          {/* NO Card */}
          <button
            onClick={() => handleVote('no')}
            className={`p-4 rounded-2xl border text-left space-y-3 transition-all ${
              selectedVote === 'no'
                ? 'bg-rose-950/80 border-rose-500 ring-2 ring-rose-500/50'
                : 'bg-[#0B0E14] border-slate-800 hover:border-rose-500/40 hover:bg-slate-900/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-rose-950 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <XCircle className="w-5 h-5" />
              </div>
              <span className="bg-rose-950 border border-rose-800 text-[10px] font-mono text-rose-300 px-2 py-0.5 rounded">
                NULL-SLOT
              </span>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">NO — Absent / Free</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Professor absent or empty room. Safe skip logged.
              </p>
            </div>
          </button>

        </div>

        {/* Quorum Progress Bar */}
        <div className="bg-[#0B0E14] border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-indigo-600 border border-black text-[9px] flex items-center justify-center text-white font-bold">AR</div>
                <div className="w-6 h-6 rounded-full bg-cyan-600 border border-black text-[9px] flex items-center justify-center text-white font-bold">PS</div>
                <div className="w-6 h-6 rounded-full bg-purple-600 border border-black text-[9px] flex items-center justify-center text-white font-bold">DC</div>
              </div>
              <div>
                <span className="text-white font-bold">3 of 4 verified peers responded</span>
                <p className="text-[10px] text-slate-500">P2P BLE Mesh • 220ms synchronization</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase">QUORUM CONFIDENCE</span>
              <span className="text-emerald-400 font-bold text-sm">94.8%</span>
            </div>
          </div>

          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full" style={{ width: '94.8%' }} />
          </div>
        </div>

        {/* Trust Notice */}
        <div className="flex items-start space-x-2 text-[11px] font-mono text-slate-400 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <span>
            Only location-verified students can vote. Low-trust votes are automatically excluded from the Bayesian ledger. Zero biometric identity stored.
          </span>
        </div>

        {/* Actions Footer */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white underline"
          >
            Dismiss / Vote Later (within 10m)
          </button>

          <div className="text-slate-500 text-[10px]">
            SHA-256 Consensus Proof #7A49-01
          </div>
        </div>

      </div>
    </div>
  );
};
