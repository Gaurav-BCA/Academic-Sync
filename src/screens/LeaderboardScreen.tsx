import React, { useState } from 'react';
import { 
  Award, 
  ShieldCheck, 
  TrendingUp, 
  Download, 
  CheckCircle2, 
  Activity, 
  Key, 
  Users 
} from 'lucide-react';
import { LEADERBOARD_DATA } from '../data/mockData';

export const LeaderboardScreen: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'week' | 'alltime' | 'faculty'>('week');

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Rank,Student,NodeID,TrustScore,Accuracy,Votes,Tier\n"
      + LEADERBOARD_DATA.map(e => `${e.rank},${e.name},${e.nodeId},${e.trustScore},${e.accuracyPct}%,${e.votesCount},${e.tier}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Consensus_Reliability_Ledger_Sem6A.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 py-4">
      
      {/* Top Title & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121722] border border-slate-800 rounded-2xl p-6">
        <div>
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
            TELEMETRY INTEGRITY VERIFICATION • Cluster // Sem VI-A
          </span>
          <h1 className="text-3xl font-extrabold text-white">Consensus Reliability Ledger</h1>
          <p className="text-xs text-slate-400 mt-1">
            Most Reliable Reporters This Week — High-trust peer nodes that ensure tamper-free academic records.
          </p>
        </div>

        <div className="flex items-center space-x-1 bg-[#0B0E14] p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveFilter('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              activeFilter === 'week' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            This Week (Sem VI-A)
          </button>
          <button
            onClick={() => setActiveFilter('alltime')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              activeFilter === 'alltime' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All-Time Cohort
          </button>
          <button
            onClick={() => setActiveFilter('faculty')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              activeFilter === 'faculty' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Faculty Validation Ratio
          </button>
        </div>
      </div>

      {/* Bayesian Rule Notice Banner */}
      <div className="bg-[#0B0E14] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-slate-400">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Rankings computed using Bayesian reliability scoring. Speed does not increase score; accuracy and cryptographic verification do.
          </span>
        </div>
        <div className="text-[10px] text-slate-500 shrink-0">
          EPOCH: 0x94B2 • SIG: ED25519
        </div>
      </div>

      {/* Main Grid: Leaderboard Table (Left) & Network Standing (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Leaderboard Table */}
        <div className="lg:col-span-8 bg-[#121722] border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase">
                  <th className="py-3 px-2">RANK</th>
                  <th className="py-3 px-2">PEER NODE / STUDENT</th>
                  <th className="py-3 px-2 text-right">TRUST SCORE</th>
                  <th className="py-3 px-2 text-right">ACCURACY %</th>
                  <th className="py-3 px-2 text-right">VOTES</th>
                  <th className="py-3 px-2 text-center">STABILITY TIER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {LEADERBOARD_DATA.map((node) => (
                  <tr 
                    key={node.nodeId}
                    className={`transition-colors ${
                      node.isCurrentUser ? 'bg-cyan-950/20 font-bold' : 'hover:bg-slate-900/40'
                    }`}
                  >
                    <td className="py-4 px-2 font-bold text-slate-300">
                      #{String(node.rank).padStart(2, '0')}
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          node.isCurrentUser ? 'bg-cyan-600 text-black' : 'bg-slate-800 text-slate-200'
                        }`}>
                          {node.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-white text-sm">{node.name}</span>
                            {node.isCurrentUser && (
                              <span className="bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.2 text-[9px] rounded uppercase font-bold">
                                YOU
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500">{node.nodeId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-right font-bold text-white text-sm">
                      {node.trustScore.toFixed(1)}
                    </td>
                    <td className="py-4 px-2 text-right">
                      <div className="text-emerald-400 font-bold text-sm">{node.accuracyPct}%</div>
                      <div className={`text-[10px] ${node.accuracyTrend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {node.accuracyTrend >= 0 ? `↑ +${node.accuracyTrend}%` : `↓ ${node.accuracyTrend}%`}
                      </div>
                    </td>
                    <td className="py-4 px-2 text-right text-slate-300">
                      {node.votesCount}
                    </td>
                    <td className="py-4 px-2 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        node.tier === 'Tier 1 Root'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : 'bg-purple-950 text-purple-300 border border-purple-500/40'
                      }`}>
                        ● {node.tier}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-400">
            <span>Showing top 5 verified nodes out of 46 registered peer units in Sem VI-A.</span>
            <button
              onClick={handleExportCSV}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-mono border border-slate-700 flex items-center space-x-2 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Full Ledger (.CSV)</span>
            </button>
          </div>
        </div>

        {/* Right Column: Network Health & Cryptographic Node Standing */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Network Health Index Card */}
          <div className="bg-[#121722] border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500 uppercase">NETWORK HEALTH INDEX</span>
              <span className="text-emerald-400 font-mono text-xs font-bold">STABLE 100%</span>
            </div>

            <div className="flex items-center space-x-4">
              {/* Circular Fidelity Gauge */}
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="32" stroke="#1E293B" strokeWidth="8" fill="transparent" />
                  <circle cx="40" cy="40" r="32" stroke="#00F0FF" strokeWidth="8" strokeDasharray={200} strokeDashoffset={200 * (1 - 0.994)} strokeLinecap="round" fill="transparent" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center font-mono">
                  <span className="text-sm font-bold text-white">99.4%</span>
                  <span className="text-[8px] text-slate-400">FIDELITY</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm">Cohort Consensus</h4>
                <p className="text-xs text-slate-400 leading-snug mt-1">
                  Zero conflicting hardware pings logged during active lecture slots.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-[#0B0E14] border border-slate-800 p-3 rounded-xl text-center font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">Pending Disputes</span>
                <span className="text-white font-bold text-base">0</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Quorum Ratio</span>
                <span className="text-cyan-400 font-bold text-base">38 / 46</span>
              </div>
            </div>

            <div className="space-y-1 text-[11px] font-mono text-slate-400">
              <span className="font-bold text-slate-300 uppercase block text-[10px]">QUORUM THRESHOLD LOGIC</span>
              <p className="text-slate-500 leading-relaxed">
                Presence records achieve ledger finality when &gt;66% of Tier 1 & Tier 2 nodes sign the classroom Bluetooth + GPS mesh challenge within a 3-minute epoch. Tampered assertions are rejected by local Bayesian probability filters.
              </p>
            </div>
          </div>

          {/* Cryptographic Node Standing */}
          <div className="bg-[#121722] border border-cyan-900/40 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 text-cyan-400">
              <Key className="w-4 h-4" />
              <h3 className="font-bold text-white text-sm">Cryptographic Node Standing</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Your client node <span className="text-white font-mono font-bold">(ALX-9942)</span> has maintained zero false reports over 64 consecutive days, granting Root consensus authority on campus-wide reconciliation cycles.
            </p>

            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 rounded-full" style={{ width: '92%' }} />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
              <span className="bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded text-[10px] font-bold">
                ROOT CERTIFIED
              </span>
              <span>NEXT EVAL: 4D 12H</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
