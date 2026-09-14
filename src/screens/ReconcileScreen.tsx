import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Upload, 
  Users, 
  FileText, 
  Radio, 
  Calendar,
  Lock
} from 'lucide-react';
import { RECONCILIATION_LEDS } from '../data/mockData';

export const ReconcileScreen: React.FC = () => {
  const [selectedReason, setSelectedReason] = useState('Authorized Offline Duty (NSS / Placement Drive)');
  const [fileUploaded, setFileUploaded] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [eventDayBypass, setEventDayBypass] = useState(false);

  const handleFileUpload = () => {
    setFileUploaded('Duty_Requisition_Pass_CS602.pdf');
  };

  const handleSubmitProof = () => {
    setSubmitted(true);
  };

  const handleFestBypass = () => {
    setEventDayBypass(true);
  };

  return (
    <div className="space-y-6 py-4">
      
      {/* Top Protocol Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121722] border border-slate-800 rounded-2xl p-5">
        <div>
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
            LEDGER PROTOCOL // EOD_CHECKPOINT_V3
          </span>
          <h1 className="text-2xl font-extrabold text-white">Evening Reconciliation & Anomaly Resolution</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Consensus ledger locks daily at 20:00 UTC. Review automated presence vectors and submit authorized offline exceptions before hardware batch finalization.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button 
            onClick={handleFestBypass}
            className={`px-4 py-2.5 rounded-xl font-mono text-xs border transition-all flex items-center space-x-2 ${
              eventDayBypass 
                ? 'bg-emerald-950 border-emerald-500 text-emerald-300' 
                : 'bg-purple-950/60 border-purple-800/60 text-purple-300 hover:bg-purple-900/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{eventDayBypass ? 'Day Flagged as Event Override ✓' : 'Mark Day as Fest / Sports Bypass'}</span>
          </button>

          <div className="bg-[#0B0E14] border border-slate-800 px-3 py-2 rounded-xl text-xs font-mono text-slate-400 flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>LOCKOUT: 02h 14m 19s</span>
          </div>
        </div>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121722] border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-slate-500 uppercase">SYNCHRONIZED STREAMS</p>
            <p className="text-2xl font-bold font-mono text-white">04 <span className="text-xs text-slate-400 font-normal">Classes Tracked Today</span></p>
          </div>
        </div>

        <div className="bg-[#121722] border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-slate-500 uppercase">QUORUM STATE</p>
            <p className="text-2xl font-bold font-mono text-white">03 <span className="text-xs text-slate-400 font-normal">Consensus Verified</span></p>
          </div>
        </div>

        <div className="bg-[#121722] border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-slate-500 uppercase">TELEMETRY INCONGRUITY</p>
            <p className="text-2xl font-bold font-mono text-rose-400">01 <span className="text-xs text-slate-400 font-normal">Anomaly Flagged</span></p>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Ledger Blocks (Left) & Resolution Ticket (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Today's Class Ledger Blocks */}
        <div className="lg:col-span-6 bg-[#121722] border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-white text-base">TODAY'S CLASS LEDGER BLOCKS</h3>
              <p className="text-xs text-slate-500 font-mono">4 Records | AUTO-POLLING SYNC // ETH-0</p>
            </div>
          </div>

          <div className="space-y-3">
            {RECONCILIATION_LEDS.map((rec) => (
              <div 
                key={rec.id}
                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                  rec.status === 'flagged' && !submitted
                    ? 'bg-rose-950/20 border-rose-500/40'
                    : rec.status === 'exempted' || eventDayBypass
                    ? 'bg-purple-950/20 border-purple-500/30'
                    : 'bg-[#0B0E14] border-slate-800'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
                    <span>{rec.time}</span>
                    <span>•</span>
                    <span className="text-slate-300 font-bold">{rec.subjectCode}</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{rec.subjectName}</h4>
                  <p className={`text-xs font-mono ${
                    rec.status === 'flagged' && !submitted
                      ? 'text-rose-400 font-bold'
                      : eventDayBypass
                      ? 'text-emerald-400 font-bold'
                      : 'text-slate-400'
                  }`}>
                    ● {eventDayBypass ? 'EVENT_OVERRIDE (Fest/Sports Bypass)' : submitted && rec.status === 'flagged' ? 'Reconciled via Peer Quorum Override ✓' : rec.statusText}
                  </p>
                </div>

                <div>
                  {rec.status === 'immutable' && (
                    <span className="bg-slate-900 border border-slate-700 text-slate-400 px-3 py-1 rounded-lg text-xs font-mono flex items-center space-x-1">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>IMMUTABLE</span>
                    </span>
                  )}
                  {rec.status === 'exempted' && (
                    <span className="bg-purple-950 border border-purple-800 text-purple-300 px-3 py-1 rounded-lg text-xs font-mono">
                      EXEMPTED
                    </span>
                  )}
                  {rec.status === 'flagged' && !submitted && !eventDayBypass && (
                    <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-indigo-600/20">
                      Reconcile Offline
                    </button>
                  )}
                  {rec.status === 'flagged' && submitted && (
                    <span className="bg-emerald-950 border border-emerald-800 text-emerald-300 px-3 py-1 rounded-lg text-xs font-mono">
                      RESOLVED ✓
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quorum Consensus Diagnostics Bar */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">QUORUM CONSENSUS DIAGNOSTICS</span>
              <span className="text-emerald-400 font-bold">NODE VERIFICATION 98.2% MATCH</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full flex overflow-hidden">
              <div className="w-[60%] bg-emerald-400" title="BLE Geofence Quorum (Pass)" />
              <div className="w-[25%] bg-cyan-400" title="WiFi SSID MAC Handshake (Pass)" />
              <div className="w-[15%] bg-rose-500" title="Telemetry Drop CS602" />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-1">
              <span>● BLE Geofence Quorum (Pass)</span>
              <span>● WiFi SSID MAC Handshake (Pass)</span>
              <span>● Telemetry Drop: CS602</span>
            </div>
          </div>
        </div>

        {/* Right Column: Active Resolution Ticket Panel */}
        <div className="lg:col-span-6 bg-[#121722] border border-purple-900/40 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider font-bold">ACTIVE RESOLUTION TICKET</span>
              <h3 className="text-lg font-bold text-white">Computer Networks (CS602)</h3>
              <p className="text-xs font-mono text-slate-500">SESSION ID: #ANOM-9024-NET</p>
            </div>
            <span className="bg-rose-950 border border-rose-800 text-rose-300 text-[10px] font-mono px-2.5 py-1 rounded-full font-bold">
              NEEDS QUORUM
            </span>
          </div>

          {/* Telemetric Variance Analysis Box */}
          <div className="bg-[#0B0E14] border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-slate-300">Telemetric Variance Analysis</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Class held, but student marked absent due to device battery drainage / geofence drop. BLE beacon proximity lost between 11:34 AM and 12:10 PM UTC.
            </p>
          </div>

          {/* Reason Selection */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-400 uppercase">Institutional Exception Reason</label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full bg-[#0B0E14] border border-slate-800 text-xs font-mono text-white rounded-xl p-3 outline-none focus:border-purple-500 transition-colors"
            >
              <option>Authorized Offline Duty (NSS / Placement Drive)</option>
              <option>Attendance Granted for College Fest Duty</option>
              <option>Medical Leave / Health Exemption</option>
              <option>Sports Representation Credit</option>
            </select>
          </div>

          {/* Verification Artifact Dropzone */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-400 uppercase">Verification Artifact (Proof / Duty Slip)</label>
            <div 
              onClick={handleFileUpload}
              className="border-2 border-dashed border-slate-800 hover:border-purple-500/50 bg-[#0B0E14] rounded-xl p-4 text-center cursor-pointer transition-all space-y-2"
            >
              <Upload className="w-6 h-6 mx-auto text-purple-400" />
              {fileUploaded ? (
                <p className="text-xs text-emerald-400 font-mono font-bold">✓ Attached: {fileUploaded}</p>
              ) : (
                <>
                  <p className="text-xs text-slate-300 font-medium">Upload duty requisition or medical pass</p>
                  <p className="text-[10px] text-slate-500 font-mono">PDF, PNG, HEIC up to 10MB</p>
                </>
              )}
            </div>
          </div>

          {/* Peer Signatures Attached */}
          <div className="bg-[#0B0E14] border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-2 text-slate-300">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Peer Signatures Attached:</span>
            </div>
            <span className="text-emerald-400 font-bold">3/3 Bench Peers (Ready)</span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleSubmitProof}
              disabled={submitted}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-purple-600/20 text-xs font-mono font-bold"
            >
              {submitted ? '✓ Peer Proof Submitted — Quorum Override Active' : 'Submit Peer Proof for Quorum Override'}
            </button>
            <button
              onClick={() => setSelectedReason('')}
              className="w-full bg-[#0B0E14] hover:bg-slate-900 border border-slate-800 text-slate-400 py-2.5 rounded-xl text-xs font-mono transition-all"
            >
              Cancel & Retain Ledger Status
            </button>
          </div>
        </div>

      </div>

      {/* Footer Security Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80 text-xs font-mono text-slate-400">
        <div className="flex items-start space-x-3 bg-[#121722] border border-slate-800 rounded-xl p-4">
          <ShieldAlert className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <h4 className="font-bold text-white">Institutional Quorum Ruleset</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Section 14.3: Hardware proxy discrepancies must be attested with a minimum of 2 peer BLE consensus beacons active during the designated lecture cycle.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3 bg-[#121722] border border-slate-800 rounded-xl p-4">
          <Lock className="w-5 h-5 text-purple-400 shrink-0" />
          <div>
            <h4 className="font-bold text-white">Immutable Consensus Locks</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              After 20:00 UTC daily, the class consensus state is signed with the faculty keypair. Offline exceptions cannot be submitted past this threshold.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
