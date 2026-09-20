import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck,
  Loader2,
  AlertTriangle
} from 'lucide-react';

import { useApp } from '../../context/AppContext';

interface SmartCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSlot?: any;
}

export const SmartCheckModal: React.FC<SmartCheckModalProps> = ({ isOpen, onClose, activeSlot }) => {
  const { consensusState, submitConsensusVote, batchData } = useApp();
  const [selectedVote, setSelectedVote] = useState<'yes' | 'no' | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [showReasonInput, setShowReasonInput] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const slotId = activeSlot?.slotId || consensusState.slotId || 'slot-current';
  const subjectName = activeSlot?.subjectName || consensusState.subjectName || 'CS601 Distributed Systems';
  const room = activeSlot?.room || 'LH-302';
  const faculty = activeSlot?.faculty || 'Dr. R. Sharma';

  const yesVotes = consensusState.yesVotes || 0;
  const noVotes = consensusState.noVotes || 0;
  const totalVotes = consensusState.totalVotes || 0;
  const confidencePct = totalVotes > 0 ? Math.min(100, Math.round((yesVotes / Math.max(1, totalVotes)) * 100)) : 100;

  const handleVoteSelect = async (vote: 'yes' | 'no') => {
    if (vote === 'no' && !showReasonInput) {
      setSelectedVote('no');
      setShowReasonInput(true);
      return;
    }

    setIsSubmitting(true);
    setSelectedVote(vote);

    const result = await submitConsensusVote(
      slotId,
      subjectName,
      vote,
      vote === 'no' ? cancellationReason : undefined
    );

    setIsSubmitting(false);

    if (result.success) {
      if (result.distance !== undefined) {
        setFeedbackMsg(`✓ Response Recorded! GPS Distance: ${result.distance}m (${result.isWithinGeofence ? 'SAFE ZONE' : 'OUTSIDE BOUNDARY'})`);
      } else {
        setFeedbackMsg(result.message || '✓ Response recorded! Peer consensus updated.');
      }

      setTimeout(() => {
        onClose();
        setSelectedVote(null);
        setShowReasonInput(false);
        setCancellationReason('');
        setFeedbackMsg(null);
      }, 2000);
    }
  };

  const handleConfirmNoVote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellationReason.trim()) return;
    handleVoteSelect('no');
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
              3-STUDENT CONSENSUS & GEOFENCE LOCK ACTIVE
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-800 transition-colors p-1.5 rounded-full hover:bg-amber-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Location & Concludes Timer Pill */}
        <div className="bg-amber-50/60 border border-amber-200/70 rounded-2xl p-3.5 flex flex-wrap items-center justify-between text-xs font-mono text-neutral-700">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-[#FF6B4B]" />
            <span className="text-neutral-900 font-bold">{room}</span>
            <span>•</span>
            <span className="font-medium">{faculty}</span>
          </div>
          <div className="flex items-center space-x-1 text-indigo-700 font-bold bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
            <Clock className="w-3.5 h-3.5" />
            <span className="tnum">T-10 Min Verification Window</span>
          </div>
        </div>

        {/* Main Title Question */}
        <div className="space-y-1">
          <h2 className="text-2xl font-jakarta font-bold text-neutral-900">Was {subjectName} conducted today?</h2>
          <p className="text-xs text-neutral-600 font-sans">
            📍 HTML5 GPS location is cross-checked against campus geofence boundary ({batchData?.geofence?.radiusMeters || 50}m radius).
          </p>
        </div>

        {/* Feedback / GPS verification banner */}
        {feedbackMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs font-mono flex items-center space-x-2 animate-fade-in shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">{feedbackMsg}</span>
          </div>
        )}

        {/* Reason Prompt Modal Step (When NO is selected) */}
        {showReasonInput ? (
          <form onSubmit={handleConfirmNoVote} className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl space-y-3">
            <div className="flex items-center space-x-2 text-rose-900 text-xs font-mono font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Please specify the cancellation reason:</span>
            </div>
            <input
              type="text"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="e.g. Teacher on official leave / Holiday / Lab maintenance"
              className="w-full bg-white border border-rose-300 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs font-sans outline-none"
              autoFocus
            />
            <div className="flex items-center justify-end space-x-2 pt-1 text-xs font-mono">
              <button
                type="button"
                onClick={() => setShowReasonInput(false)}
                className="px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-neutral-600 hover:text-neutral-900"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!cancellationReason.trim() || isSubmitting}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg disabled:opacity-50 flex items-center space-x-1"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Confirm Cancellation Vote</span>}
              </button>
            </div>
          </form>
        ) : (
          /* Voting Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* YES Card */}
            <button
              onClick={() => handleVoteSelect('yes')}
              disabled={isSubmitting}
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
                  YES ({yesVotes}/3)
                </span>
              </div>
              <div>
                <h4 className="font-jakarta font-bold text-neutral-900 text-sm">YES — Lecture Conducted</h4>
                <p className="text-[11px] text-neutral-600 mt-1 leading-snug">
                  Session held in class. 3 YES votes verify lecture as CONDUCTED.
                </p>
              </div>
            </button>

            {/* NO Card */}
            <button
              onClick={() => handleVoteSelect('no')}
              disabled={isSubmitting}
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
                  NO ({noVotes}/3)
                </span>
              </div>
              <div>
                <h4 className="font-jakarta font-bold text-neutral-900 text-sm">NO — Lecture Cancelled</h4>
                <p className="text-[11px] text-neutral-600 mt-1 leading-snug">
                  Teacher absent / session cancelled. 3 NO votes preserve attendance.
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Quorum Progress Bar */}
        <div className="bg-amber-50/50 border border-amber-200/70 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-neutral-900 font-bold tnum">{totalVotes} of 3 Student Peer Votes Collected</span>
              <p className="text-[10px] text-neutral-500 font-medium">Real-Time Firestore Consensus Active</p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-neutral-500 block uppercase font-bold">CONFIDENCE</span>
              <span className="text-emerald-700 font-bold text-sm tnum">{confidencePct}%</span>
            </div>
          </div>

          <div className="w-full h-2 bg-amber-100/80 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#FF6B4B] to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (totalVotes / 3) * 100)}%` }} />
          </div>
        </div>

        {/* Haversine Geofence Info Notice */}
        <div className="flex items-start space-x-2 text-[11px] font-mono text-neutral-500 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            {consensusState.lastGeoDistance !== null && consensusState.lastGeoDistance !== undefined
              ? `GPS Verified: ${consensusState.lastGeoDistance}m from campus geofence (${consensusState.lastGeoVerified ? 'PRESENT' : 'ABSENT'}).`
              : 'GPS verification checks your location against campus geofence boundary.'}
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
            Status: <span className="uppercase font-bold text-indigo-700">{consensusState.status}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
