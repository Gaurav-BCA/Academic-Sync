import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Cpu, 
  Target, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  Copy,
  Radio
} from 'lucide-react';

interface OverviewGateScreenProps {
  onNavigateToDashboard: () => void;
  onNavigateToTimetable: () => void;
}

export const OverviewGateScreen: React.FC<OverviewGateScreenProps> = ({
  onNavigateToDashboard,
  onNavigateToTimetable,
}) => {
  const [tokenInput, setTokenInput] = useState('CS-8849');
  const [isParsing, setIsParsing] = useState(false);
  const [parseSuccess, setParseSuccess] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const handleCopyToken = () => {
    navigator.clipboard.writeText('CS-8849');
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleAutoParse = () => {
    setIsParsing(true);
    setTimeout(() => {
      setIsParsing(false);
      setParseSuccess(true);
      setTimeout(() => {
        onNavigateToTimetable();
      }, 1200);
    }, 1500);
  };

  return (
    <div className="space-y-6 py-4">
      {/* Top Tag */}
      <div className="flex justify-center">
        <div className="inline-flex items-center space-x-2 bg-[#10B981]/10 border border-[#10B981]/30 px-3 py-1 rounded text-xs font-mono text-[#10B981]">
          <span className="radar-dot" />
          <span className="tnum uppercase">SYSTEM V4.8 • ZERO DETENTION ENGINE ACTIVE</span>
        </div>
      </div>

      {/* Hero Headline */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-jakarta font-bold tracking-tight text-white">
          Predict. Optimize. <span className="bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#6BD8CB] bg-clip-text text-transparent">Maintain Policy Margin.</span>
        </h1>
        <p className="text-sm text-[#94A3B8] leading-relaxed font-sans">
          Developer-grade P2P mesh consensus and multi-variate Bayesian risk modeling for academic telemetry. Stealth analytics engineered to camouflage backend presence tracking.
        </p>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="stealth-card p-5 space-y-2">
          <p className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">ACTIVE MESH TELEMETRY</p>
          <div className="text-3xl font-jakarta font-bold text-white tnum">3,820</div>
          <div className="flex items-center space-x-2 text-xs text-[#6BD8CB] font-mono">
            <Cpu className="w-3.5 h-3.5 text-[#6BD8CB]" />
            <span>Class Nodes Operational</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="stealth-card p-5 space-y-2">
          <p className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">BAYESIAN VERIFICATION</p>
          <div className="text-3xl font-jakarta font-bold text-white tnum">99.8%</div>
          <div className="flex items-center space-x-2 text-xs text-[#10B981] font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
            <span>GPS Consensus Precision</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="stealth-card p-5 space-y-2">
          <p className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">COMPLIANCE THRESHOLD</p>
          <div className="text-3xl font-jakarta font-bold text-white tnum">0.0%</div>
          <div className="flex items-center space-x-2 text-xs text-[#8B5CF6] font-mono">
            <Target className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>Policy Deficit Rate</span>
          </div>
        </div>
      </div>

      {/* Main Two Gate Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Gate Card: Enroll Existing Batch */}
        <div className="stealth-card p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#94A3B8] uppercase tracking-wider">ENROLL EXISTING CLASS BATCH</span>
              <span className="bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tnum">
                Instant Mesh Sync
              </span>
            </div>
            
            <h2 className="text-xl font-jakarta font-bold text-white">Class Member Gate</h2>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Synchronize live telemetry with your assigned cohort. Automatically pull real-time lecture check-ins, quorum votes, and dynamic bypass thresholds safely masked as pipeline logs.
            </p>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                <span>Enter 6-Digit Telemetry Mesh Token</span>
                <button 
                  onClick={handleCopyToken}
                  className="flex items-center space-x-1 text-[#6BD8CB] hover:text-white font-mono text-[11px]"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedToken ? 'Copied!' : 'Try: CS-8849'}</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                  placeholder="e.g. CS-8849"
                  className="input-stealth w-full font-mono text-base tracking-wider uppercase"
                />
                {tokenInput && (
                  <button
                    onClick={() => setTokenInput('')}
                    className="absolute right-3 top-2 text-xs text-[#64748B] hover:text-[#DFE2F1] font-mono"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={onNavigateToDashboard}
              className="btn-primary w-full py-2.5 flex items-center justify-center space-x-2 text-xs uppercase tracking-wider"
            >
              <Radio className="w-4 h-4" />
              <span>Join Class Batch Telemetry</span>
            </button>
          </div>

          <div className="pt-4 border-t border-[#233044] space-y-2">
            <p className="text-[10px] font-mono text-[#64748B] uppercase">RECENTLY VERIFIED COHORTS</p>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <span className="bg-[#161F30] border border-[#10B981]/40 text-[#10B981] px-2.5 py-1 rounded tnum">
                CS-AI-Sem6 <span className="text-[10px] opacity-80">[Active]</span>
              </span>
              <span className="bg-[#161F30] border border-[#233044] text-[#94A3B8] px-2.5 py-1 rounded tnum">
                ECE-Dept-A <span className="text-[10px] text-[#64748B]">(Archived)</span>
              </span>
              <span className="bg-[#161F30] border border-[#233044] text-[#94A3B8] px-2.5 py-1 rounded tnum">
                Math-Honors-24
              </span>
            </div>
          </div>
        </div>

        {/* Right Gate Card: CR Hub */}
        <div className="stealth-card p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#94A3B8] uppercase tracking-wider">INITIALIZE NEW BATCH TIMETABLE</span>
              <span className="bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/30 px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tnum">
                CR Engine Root
              </span>
            </div>

            <h2 className="text-xl font-jakarta font-bold text-white">Class Representative Hub</h2>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Establish your cohort's lecture master grid. Upload institutional syllabus routines for OCR slot extraction and configure automated quorum check-ins.
            </p>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-mono text-[#94A3B8] block mb-1">INSTITUTION</label>
                <select className="input-stealth w-full font-mono text-xs">
                  <option>Apex Inst. of Tech</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#94A3B8] block mb-1">BRANCH / DEPT</label>
                <select className="input-stealth w-full font-mono text-xs">
                  <option>Comp. Sci. & Eng</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#94A3B8] block mb-1">TERM CYCLE</label>
                <select className="input-stealth w-full font-mono text-xs">
                  <option>Sem VI - 2025</option>
                </select>
              </div>
            </div>

            {/* Drag and Drop Zone */}
            <div 
              onClick={handleAutoParse}
              className="border border-dashed border-[#233044] hover:border-[#6366F1] bg-[#161F30] rounded p-5 text-center cursor-pointer transition-colors space-y-2 group"
            >
              <Upload className="w-6 h-6 mx-auto text-[#8B5CF6] transition-transform" />
              <p className="text-xs text-[#DFE2F1] font-medium">Click to upload schedule routine image or document</p>
              <p className="text-[10px] text-[#64748B] font-mono">Supports JPG, PNG, PDF with automated LLM extraction</p>
            </div>

            <button
              onClick={handleAutoParse}
              disabled={isParsing}
              className="btn-stealth w-full py-2.5 flex items-center justify-center space-x-2 text-xs font-mono uppercase"
            >
              <Sparkles className={`w-4 h-4 text-[#8B5CF6] ${isParsing ? 'animate-spin' : ''}`} />
              <span>{isParsing ? 'Parsing Timetable via LLM...' : parseSuccess ? 'Timetable Parsed! Redirecting...' : 'Auto-Parse Timetable with AI'}</span>
            </button>
          </div>

          <div className="pt-4 border-t border-[#233044] flex items-center justify-between text-[11px] font-mono text-[#64748B]">
            <span className="flex items-center space-x-1">
              <ShieldAlert className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Zero Audit Footprint</span>
            </span>
            <span className="tnum">OCR LATENCY &lt; 1.2s</span>
          </div>
        </div>

      </div>

      {/* Bottom Live Mesh Status Bar */}
      <div className="stealth-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center space-x-3">
          <span className="radar-dot" />
          <span className="text-[#DFE2F1] font-bold uppercase">LIVE CONSENSUS PEER MESH</span>
          <span className="text-[#94A3B8] hidden md:inline tnum">
            Hall 402 - CS401 Distributed Systems currently quorum locked (42/48 peers present)
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex -space-x-1.5">
            <div className="w-5 h-5 rounded-full bg-[#8B5CF6] text-[9px] flex items-center justify-center font-bold text-white tnum">P1</div>
            <div className="w-5 h-5 rounded-full bg-[#0D9488] text-[9px] flex items-center justify-center font-bold text-white tnum">P2</div>
            <div className="w-5 h-5 rounded-full bg-[#10B981] text-[9px] flex items-center justify-center font-bold text-white tnum">P3</div>
          </div>
          <span className="text-[#94A3B8] font-mono text-[11px] tnum">+39</span>
          <button 
            onClick={onNavigateToDashboard}
            className="btn-stealth px-2.5 py-1 text-xs"
          >
            Mesh In Sync
          </button>
        </div>
      </div>

    </div>
  );
};
