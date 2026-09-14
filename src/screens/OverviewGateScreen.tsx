import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Cpu, 
  Target, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
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
    <div className="space-y-8 py-4">
      {/* Top Tag */}
      <div className="flex justify-center">
        <div className="inline-flex items-center space-x-2 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-full text-[11px] font-mono text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>SYSTEM V4.8 • ZERO DETENTION ENGINE ACTIVE</span>
        </div>
      </div>

      {/* Hero Headline */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
          Predict. Optimize. <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-500 bg-clip-text text-transparent">Stay Above 75%.</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-sans">
          Enterprise-grade GPS crowd consensus and multi-variate Bayesian risk modeling for university lecture tracking. Stealth analytics that camouflage backend academic telemetry.
        </p>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="bg-[#121722] border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all">
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">ACTIVE MESH TELEMETRY</p>
          <div className="text-3xl font-mono font-bold text-white mb-2">3,820</div>
          <div className="flex items-center space-x-2 text-xs text-cyan-400 font-mono">
            <Cpu className="w-3.5 h-3.5" />
            <span>Class Nodes Operational</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#121722] border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all">
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">BAYESIAN VERIFICATION</p>
          <div className="text-3xl font-mono font-bold text-white mb-2">99.8%</div>
          <div className="flex items-center space-x-2 text-xs text-emerald-400 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>GPS Consensus Precision</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#121722] border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all">
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">COMPLIANCE THRESHOLD</p>
          <div className="text-3xl font-mono font-bold text-white mb-2">0.0%</div>
          <div className="flex items-center space-x-2 text-xs text-purple-400 font-mono">
            <Target className="w-3.5 h-3.5" />
            <span>Detention Breach Rate</span>
          </div>
        </div>
      </div>

      {/* Main Two Gate Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Gate Card: Enroll Existing Batch */}
        <div className="bg-[#121722] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">ENROLL EXISTING CLASS BATCH</span>
              <span className="bg-cyan-950/60 text-cyan-400 border border-cyan-800/50 px-2.5 py-0.5 rounded-full text-[10px] font-mono">
                Instant Mesh Sync
              </span>
            </div>
            
            <h2 className="text-2xl font-bold text-white">Class Member Gate</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Synchronize live telemetry with your assigned cohort. Automatically pull real-time lecture check-ins, quorum votes, and dynamic bypass thresholds safely masked as pipeline logs.
            </p>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Enter 6-Digit Telemetry Mesh Token</span>
                <button 
                  onClick={handleCopyToken}
                  className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 font-mono text-[11px]"
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
                  className="w-full bg-[#0B0E14] border border-slate-700/80 focus:border-cyan-500 rounded-xl px-4 py-3 font-mono text-white text-base tracking-wider outline-none transition-all"
                />
                {tokenInput && (
                  <button
                    onClick={() => setTokenInput('')}
                    className="absolute right-3 top-3 text-xs text-slate-500 hover:text-slate-300 font-mono"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={onNavigateToDashboard}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2 text-sm font-semibold"
            >
              <Radio className="w-4 h-4" />
              <span>Join Class Batch</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <p className="text-[10px] font-mono text-slate-500 uppercase">RECENTLY VERIFIED COHORTS</p>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <span className="bg-slate-900 border border-emerald-500/40 text-emerald-300 px-2.5 py-1 rounded-lg">
                CS-AI-Sem6 <span className="text-[10px] text-emerald-400">[Active]</span>
              </span>
              <span className="bg-slate-900 border border-slate-800 text-slate-400 px-2.5 py-1 rounded-lg">
                ECE-Dept-A <span className="text-[10px] text-slate-500">(Archived)</span>
              </span>
              <span className="bg-slate-900 border border-slate-800 text-slate-400 px-2.5 py-1 rounded-lg">
                Math-Honors-24
              </span>
            </div>
          </div>
        </div>

        {/* Right Gate Card: CR Hub */}
        <div className="bg-[#121722] border border-purple-900/30 rounded-2xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">INITIALIZE NEW BATCH TIMETABLE</span>
              <span className="bg-purple-950/60 text-purple-400 border border-purple-800/50 px-2.5 py-0.5 rounded-full text-[10px] font-mono">
                CR Engine Root
              </span>
            </div>

            <h2 className="text-2xl font-bold text-white">Class Representative Hub</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Establish your cohort's lecture master grid. Upload institutional syllabus routines for OCR slot extraction and configure automated quorum check-ins.
            </p>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">INSTITUTION</label>
                <select className="w-full bg-[#0B0E14] border border-slate-800 text-xs font-mono text-slate-300 rounded-lg p-2 outline-none">
                  <option>Apex Inst. of Tech</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">BRANCH / DEPT</label>
                <select className="w-full bg-[#0B0E14] border border-slate-800 text-xs font-mono text-slate-300 rounded-lg p-2 outline-none">
                  <option>Comp. Sci. & Eng</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">TERM CYCLE</label>
                <select className="w-full bg-[#0B0E14] border border-slate-800 text-xs font-mono text-slate-300 rounded-lg p-2 outline-none">
                  <option>Sem VI - 2025</option>
                </select>
              </div>
            </div>

            {/* Drag and Drop Zone */}
            <div 
              onClick={handleAutoParse}
              className="border-2 border-dashed border-slate-800 hover:border-purple-500/50 bg-[#0B0E14] rounded-xl p-6 text-center cursor-pointer transition-all space-y-2 group"
            >
              <Upload className="w-7 h-7 mx-auto text-purple-400 group-hover:scale-110 transition-transform" />
              <p className="text-xs text-slate-300 font-medium">Click to upload or drag schedule routine</p>
              <p className="text-[10px] text-slate-500 font-mono">Supports JPG, PNG, PDF with automatic OCR slot extraction</p>
            </div>

            <button
              onClick={handleAutoParse}
              disabled={isParsing}
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center space-x-2 text-sm"
            >
              <Sparkles className={`w-4 h-4 text-purple-400 ${isParsing ? 'animate-spin' : ''}`} />
              <span>{isParsing ? 'Parsing Timetable via LLM...' : parseSuccess ? 'Timetable Parsed! Redirecting...' : 'Auto-Parse Timetable with AI'}</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span className="flex items-center space-x-1">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero Audit Footprint</span>
            </span>
            <span>OCR LATENCY &lt; 1.2s</span>
          </div>
        </div>

      </div>

      {/* Bottom Live Mesh Status Bar */}
      <div className="bg-[#121722] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-slate-400 font-bold uppercase">LIVE CONSENSUS PEER MESH</span>
          <span className="text-slate-300 hidden md:inline">
            Hall 402 - CS401 Distributed Systems currently quorum locked (42/48 peers present)
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex -space-x-2">
            <div className="w-6 h-6 rounded-full bg-purple-600 border border-slate-900 text-[10px] flex items-center justify-center font-bold text-white">P1</div>
            <div className="w-6 h-6 rounded-full bg-cyan-600 border border-slate-900 text-[10px] flex items-center justify-center font-bold text-white">P2</div>
            <div className="w-6 h-6 rounded-full bg-emerald-600 border border-slate-900 text-[10px] flex items-center justify-center font-bold text-white">P3</div>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">+39</span>
          <button 
            onClick={onNavigateToDashboard}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded-lg text-xs font-mono border border-slate-700"
          >
            Mesh In Sync
          </button>
        </div>
      </div>

    </div>
  );
};
