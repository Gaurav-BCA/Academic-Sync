import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Upload, 
  Users, 
  FileText, 
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 stealth-card p-5">
        <div>
          <span className="text-[10px] font-mono text-[#6BD8CB] uppercase tracking-wider block mb-1 tnum">
            LEDGER PROTOCOL // EOD_CHECKPOINT_V3
          </span>
          <h1 className="text-xl font-jakarta font-bold text-white">Telemetry Reconciliation & Anomaly Audit</h1>
          <p className="text-xs text-[#94A3B8] mt-1 max-w-2xl font-sans">
            Consensus ledger locks daily at 20:00 UTC. Review automated presence vectors and submit authorized offline exceptions before hardware batch finalization.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button 
            onClick={handleFestBypass}
            className={`btn-stealth px-3 py-2 text-xs font-mono flex items-center space-x-2 ${
              eventDayBypass ? 'border-[#10B981] text-[#10B981]' : ''
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span className="tnum">{eventDayBypass ? 'Day Flagged as Event Override ✓' : 'Mark Day as Fest / Sports Bypass'}</span>
          </button>

          <div className="bg-[#161F30] border border-[#233044] px-3 py-2 rounded text-xs font-mono text-[#94A3B8] flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span className="tnum">LOCKOUT: 02h 14m 19s</span>
          </div>
        </div>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stealth-card p-4 flex items-center space-x-3">
          <div className="w-9 h-9 rounded bg-[#161F30] border border-[#233044] flex items-center justify-center text-[#94A3B8]">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-[#64748B] uppercase">SYNCHRONIZED STREAMS</p>
            <p className="text-xl font-jakarta font-bold text-white tnum">04 <span className="text-xs text-[#94A3B8] font-mono font-normal">Modules Tracked Today</span></p>
          </div>
        </div>

        <div className="stealth-card p-4 flex items-center space-x-3">
          <div className="w-9 h-9 rounded bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center text-[#10B981]">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-[#64748B] uppercase">QUORUM STATE</p>
            <p className="text-xl font-jakarta font-bold text-white tnum">03 <span className="text-xs text-[#94A3B8] font-mono font-normal">Consensus Verified</span></p>
          </div>
        </div>

        <div className="stealth-card p-4 flex items-center space-x-3">
          <div className="w-9 h-9 rounded bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-center text-[#EF4444]">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-[#64748B] uppercase">TELEMETRY INCONGRUITY</p>
            <p className="text-xl font-jakarta font-bold text-[#EF4444] tnum">01 <span className="text-xs text-[#94A3B8] font-mono font-normal">Anomaly Flagged</span></p>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Ledger Blocks (Left) & Resolution Ticket (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Today's Class Ledger Blocks */}
        <div className="lg:col-span-6 stealth-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#233044]">
            <div>
              <h3 className="font-jakarta font-bold text-white text-base">TODAY'S TELEMETRY LEDGER BLOCKS</h3>
              <p className="text-xs text-[#64748B] font-mono tnum">4 Records | AUTO-POLLING SYNC // ETH-0</p>
            </div>
          </div>

          <div className="space-y-3">
            {RECONCILIATION_LEDS.map((rec) => (
              <div 
                key={rec.id}
                className={`p-4 rounded border flex items-center justify-between transition-colors ${
                  rec.status === 'flagged' && !submitted
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
                    rec.status === 'flagged' && !submitted
                      ? 'text-[#EF4444] font-bold'
                      : eventDayBypass
                      ? 'text-[#10B981] font-bold'
                      : 'text-[#94A3B8]'
                  }`}>
                    ● {eventDayBypass ? 'EVENT_OVERRIDE (Fest/Sports Bypass)' : submitted && rec.status === 'flagged' ? 'Reconciled via Peer Quorum Override ✓' : rec.statusText}
                  </p>
                </div>

                <div>
                  {rec.status === 'immutable' && (
                    <span className="bg-[#161F30] border border-[#233044] text-[#94A3B8] px-2.5 py-1 rounded text-xs font-mono flex items-center space-x-1 tnum">
                      <Lock className="w-3 h-3 text-[#10B981]" />
                      <span>IMMUTABLE</span>
                    </span>
                  )}
                  {rec.status === 'exempted' && (
                    <span className="bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#8B5CF6] px-2.5 py-1 rounded text-xs font-mono tnum">
                      EXEMPTED
                    </span>
                  )}
                  {rec.status === 'flagged' && !submitted && !eventDayBypass && (
                    <button className="btn-primary px-3 py-1.5 text-xs font-mono uppercase">
                      Reconcile Offline
                    </button>
                  )}
                  {rec.status === 'flagged' && submitted && (
                    <span className="bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] px-2.5 py-1 rounded text-xs font-mono tnum">
                      RESOLVED ✓
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quorum Consensus Diagnostics Bar */}
          <div className="pt-4 border-t border-[#233044] space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[#94A3B8]">QUORUM CONSENSUS DIAGNOSTICS</span>
              <span className="text-[#10B981] font-bold tnum">NODE VERIFICATION 98.2% MATCH</span>
            </div>
            <div className="w-full h-1.5 bg-[#0F131D] rounded-full flex overflow-hidden">
              <div className="w-[60%] bg-[#10B981]" title="BLE Geofence Quorum (Pass)" />
              <div className="w-[25%] bg-[#6BD8CB]" title="WiFi SSID MAC Handshake (Pass)" />
              <div className="w-[15%] bg-[#EF4444]" title="Telemetry Drop CS602" />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-[#64748B] pt-1">
              <span>● BLE Geofence Quorum (Pass)</span>
              <span>● WiFi SSID MAC Handshake (Pass)</span>
              <span>● Telemetry Drop: CS602</span>
            </div>
          </div>
        </div>

        {/* Right Column: Active Resolution Ticket Panel */}
        <div className="lg:col-span-6 stealth-card p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#233044]">
            <div>
              <span className="text-[10px] font-mono text-[#EF4444] uppercase tracking-wider font-bold">ACTIVE RESOLUTION TICKET</span>
              <h3 className="text-base font-jakarta font-bold text-white">Distributed Networks (CS602)</h3>
              <p className="text-xs font-mono text-[#64748B] tnum">SESSION ID: #ANOM-9024-NET</p>
            </div>
            <span className="bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#EF4444] text-[10px] font-mono px-2.5 py-1 rounded font-bold uppercase tnum">
              NEEDS QUORUM
            </span>
          </div>

          {/* Telemetric Variance Analysis Box */}
          <div className="bg-[#161F30] border border-[#233044] rounded p-4 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-mono text-[#94A3B8]">
              <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
              <span className="font-bold text-[#DFE2F1]">Telemetric Variance Analysis</span>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed font-sans">
              Module executed, but node marked offline due to device battery drainage / geofence drop. BLE beacon proximity lost between 11:34 AM and 12:10 PM UTC.
            </p>
          </div>

          {/* Reason Selection */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-[#94A3B8] uppercase">Institutional Exception Reason</label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="input-stealth w-full font-mono text-xs"
            >
              <option>Authorized Offline Duty (NSS / Placement Drive)</option>
              <option>Attendance Granted for College Fest Duty</option>
              <option>Medical Leave / Health Exemption</option>
              <option>Sports Representation Credit</option>
            </select>
          </div>

          {/* Verification Artifact Dropzone */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-[#94A3B8] uppercase">Verification Artifact (Proof / Duty Slip)</label>
            <div 
              onClick={handleFileUpload}
              className="border border-dashed border-[#233044] hover:border-[#6366F1] bg-[#161F30] rounded p-4 text-center cursor-pointer transition-colors space-y-2"
            >
              <Upload className="w-5 h-5 mx-auto text-[#8B5CF6]" />
              {fileUploaded ? (
                <p className="text-xs text-[#10B981] font-mono font-bold">✓ Attached: {fileUploaded}</p>
              ) : (
                <>
                  <p className="text-xs text-[#DFE2F1] font-medium">Upload duty requisition or medical pass</p>
                  <p className="text-[10px] text-[#64748B] font-mono">PDF, PNG, HEIC up to 10MB</p>
                </>
              )}
            </div>
          </div>

          {/* Peer Signatures Attached */}
          <div className="bg-[#161F30] border border-[#233044] rounded p-3 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-2 text-[#94A3B8]">
              <Users className="w-4 h-4 text-[#8B5CF6]" />
              <span>Peer Signatures Attached:</span>
            </div>
            <span className="text-[#10B981] font-bold tnum">3/3 Bench Peers (Ready)</span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleSubmitProof}
              disabled={submitted}
              className="btn-primary w-full py-2.5 text-xs font-mono uppercase font-bold"
            >
              {submitted ? '✓ Peer Proof Submitted — Quorum Override Active' : 'Submit Peer Proof for Quorum Override'}
            </button>
            <button
              onClick={() => setSelectedReason('')}
              className="btn-stealth w-full py-2 text-xs font-mono"
            >
              Cancel & Retain Ledger Status
            </button>
          </div>
        </div>

      </div>

      {/* Footer Security Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#233044] text-xs font-mono text-[#94A3B8]">
        <div className="stealth-card p-4 flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-[#6BD8CB] shrink-0" />
          <div>
            <h4 className="font-jakarta font-semibold text-white">Institutional Quorum Ruleset</h4>
            <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
              Section 14.3: Hardware proxy discrepancies must be attested with a minimum of 2 peer BLE consensus beacons active during the designated lecture cycle.
            </p>
          </div>
        </div>

        <div className="stealth-card p-4 flex items-start space-x-3">
          <Lock className="w-5 h-5 text-[#8B5CF6] shrink-0" />
          <div>
            <h4 className="font-jakarta font-semibold text-white">Immutable Consensus Locks</h4>
            <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
              After 20:00 UTC daily, the class consensus state is signed with the faculty keypair. Offline exceptions cannot be submitted past this threshold.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
