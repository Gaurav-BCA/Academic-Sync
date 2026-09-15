import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Download, 
  Key 
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 stealth-card p-6">
        <div>
          <span className="text-[10px] font-mono text-[#6BD8CB] uppercase tracking-wider block mb-1 tnum">
            TELEMETRY INTEGRITY VERIFICATION • Cluster // Sem VI-A
          </span>
          <h1 className="text-xl font-jakarta font-bold text-white">Node Consensus & Quorum Trust Matrix</h1>
          <p className="text-xs text-[#94A3B8] mt-1 font-sans">
            Highest-Reliability Peer Telemetry Nodes — Verified cryptographic nodes maintaining zero presence discrepancies.
          </p>
        </div>

        <div className="flex items-center space-x-1 bg-[#161F30] p-1 rounded border border-[#233044] shrink-0">
          <button
            onClick={() => setActiveFilter('week')}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
              activeFilter === 'week' ? 'bg-[#1E293B] text-white font-bold' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            This Cycle (Sem VI-A)
          </button>
          <button
            onClick={() => setActiveFilter('alltime')}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
              activeFilter === 'alltime' ? 'bg-[#1E293B] text-white font-bold' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            All-Time Cluster
          </button>
          <button
            onClick={() => setActiveFilter('faculty')}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
              activeFilter === 'faculty' ? 'bg-[#1E293B] text-white font-bold' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Validation Ratio
          </button>
        </div>
      </div>

      {/* Bayesian Rule Notice Banner */}
      <div className="bg-[#161F30] border border-[#233044] rounded p-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-[#94A3B8]">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
          <span>
            Node reliability calculated using Bayesian multi-variate modeling. Cryptographic attestation and BLE mesh precision increase weight.
          </span>
        </div>
        <div className="text-[10px] text-[#64748B] shrink-0 tnum">
          EPOCH: 0x94B2 • SIG: ED25519
        </div>
      </div>

      {/* Main Grid: Leaderboard Table (Left) & Network Standing (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Leaderboard Table */}
        <div className="lg:col-span-8 stealth-card p-6 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-[#233044] text-[#64748B] text-[10px] uppercase">
                  <th className="py-3 px-2">RANK</th>
                  <th className="py-3 px-2">PEER NODE / IDENTIFIER</th>
                  <th className="py-3 px-2 text-right">TRUST SCORE</th>
                  <th className="py-3 px-2 text-right">ACCURACY %</th>
                  <th className="py-3 px-2 text-right">VOTES</th>
                  <th className="py-3 px-2 text-center">STABILITY TIER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#233044]">
                {LEADERBOARD_DATA.map((node) => (
                  <tr 
                    key={node.nodeId}
                    className={`transition-colors ${
                      node.isCurrentUser ? 'bg-[#6366F1]/10 font-bold' : 'hover:bg-[#161F30]'
                    }`}
                  >
                    <td className="py-3.5 px-2 font-bold text-[#DFE2F1] tnum">
                      #{String(node.rank).padStart(2, '0')}
                    </td>
                    <td className="py-3.5 px-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs tnum ${
                          node.isCurrentUser ? 'bg-[#6366F1] text-white' : 'bg-[#161F30] border border-[#233044] text-[#DFE2F1]'
                        }`}>
                          {node.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-white text-sm font-jakarta font-semibold">{node.name}</span>
                            {node.isCurrentUser && (
                              <span className="bg-[#6366F1]/20 text-[#6366F1] border border-[#6366F1]/40 px-1.5 py-0.2 text-[9px] rounded uppercase font-bold">
                                YOU
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#64748B] tnum">{node.nodeId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 text-right font-jakarta font-bold text-white text-sm tnum">
                      {node.trustScore.toFixed(1)}
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      <div className="text-[#10B981] font-bold text-sm tnum">{node.accuracyPct}%</div>
                      <div className={`text-[10px] tnum ${node.accuracyTrend >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                        {node.accuracyTrend >= 0 ? `↑ +${node.accuracyTrend}%` : `↓ ${node.accuracyTrend}%`}
                      </div>
                    </td>
                    <td className="py-3.5 px-2 text-right text-[#DFE2F1] tnum">
                      {node.votesCount}
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold tnum ${
                        node.tier === 'Tier 1 Root'
                          ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30'
                          : 'bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/30'
                      }`}>
                        ● {node.tier}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-4 border-t border-[#233044] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-[#94A3B8]">
            <span className="tnum">Showing top 5 verified nodes out of 46 registered peer units in Sem VI-A.</span>
            <button
              onClick={handleExportCSV}
              className="btn-stealth px-3 py-1.5 text-xs font-mono flex items-center space-x-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Full Ledger (.CSV)</span>
            </button>
          </div>
        </div>

        {/* Right Column: Network Health & Cryptographic Node Standing */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Network Health Index Card */}
          <div className="stealth-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#64748B] uppercase">NETWORK HEALTH INDEX</span>
              <span className="text-[#10B981] font-mono text-xs font-bold tnum">STABLE 100%</span>
            </div>

            <div className="flex items-center space-x-4">
              {/* Circular Fidelity Gauge */}
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="26" stroke="#1E293B" strokeWidth="6" fill="transparent" />
                  <circle cx="32" cy="32" r="26" stroke="#6BD8CB" strokeWidth="6" strokeDasharray={163} strokeDashoffset={163 * (1 - 0.994)} strokeLinecap="round" fill="transparent" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center font-mono">
                  <span className="text-xs font-bold text-white tnum">99.4%</span>
                  <span className="text-[7px] text-[#64748B]">FIDELITY</span>
                </div>
              </div>

              <div>
                <h4 className="font-jakarta font-semibold text-white text-sm">Cluster Consensus</h4>
                <p className="text-xs text-[#94A3B8] leading-snug mt-1 font-sans">
                  Zero conflicting hardware pings logged during active telemetry slots.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-[#161F30] border border-[#233044] p-3 rounded text-center font-mono text-xs">
              <div>
                <span className="text-[10px] text-[#64748B] block">Pending Disputes</span>
                <span className="text-white font-bold text-sm tnum">0</span>
              </div>
              <div>
                <span className="text-[10px] text-[#64748B] block">Quorum Ratio</span>
                <span className="text-[#6BD8CB] font-bold text-sm tnum">38 / 46</span>
              </div>
            </div>

            <div className="space-y-1 text-[11px] font-mono text-[#94A3B8]">
              <span className="font-bold text-[#DFE2F1] uppercase block text-[10px]">QUORUM THRESHOLD LOGIC</span>
              <p className="text-[#64748B] leading-relaxed">
                Presence records achieve ledger finality when &gt;66% of Tier 1 & Tier 2 nodes sign the classroom Bluetooth + GPS mesh challenge within a 3-minute epoch.
              </p>
            </div>
          </div>

          {/* Cryptographic Node Standing */}
          <div className="stealth-card p-6 space-y-4">
            <div className="flex items-center space-x-2 text-[#6366F1]">
              <Key className="w-4 h-4" />
              <h3 className="font-jakarta font-bold text-white text-sm">Cryptographic Node Standing</h3>
            </div>

            <p className="text-xs text-[#94A3B8] leading-relaxed font-sans">
              Your client node <span className="text-white font-mono font-bold">(ALX-9942)</span> has maintained zero false reports over 64 consecutive days, granting Root consensus authority on reconciliation cycles.
            </p>

            <div className="w-full h-1.5 bg-[#0F131D] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-full" style={{ width: '92%' }} />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8] pt-1">
              <span className="bg-[#6366F1]/20 text-[#6366F1] border border-[#6366F1]/30 px-2 py-0.5 rounded text-[10px] font-bold">
                ROOT CERTIFIED
              </span>
              <span className="tnum">NEXT EVAL: 4D 12H</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
