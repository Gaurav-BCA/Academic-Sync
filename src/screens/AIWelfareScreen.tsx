import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Send, 
  FileText, 
  CheckCircle2, 
  Bot, 
  Download, 
  Mail, 
  ShieldCheck 
} from 'lucide-react';

export const AIWelfareScreen: React.FC = () => {
  const [facultyName, setFacultyName] = useState('Dr. R. Sharma');
  const [subject, setSubject] = useState('CS601 Distributed Systems');
  const [date, setDate] = useState('2025-10-27');
  const [reasonCategory, setReasonCategory] = useState('Fest / Event Duty');
  const [informalInput, setInformalInput] = useState(
    'Missed class due to NSS placement drive coordination duty at Main Auditorium. Needed to assist 3rd year students. Requesting formal leave credit.'
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [generatedEmail, setGeneratedEmail] = useState({
    subject: 'Request for Attendance Exemption & Credit Reinstatement — Distributed Systems (CS601)',
    body: `Respected Dr. R. Sharma,

I am writing to formally request attendance credit reinstatement for the Distributed Systems (CS601) lecture conducted on October 27, 2025. 

On the specified date, I was officially assigned to administrative offline duty representing the institution at the NSS Placement Drive in the Main Auditorium, pursuant to official institutional requisition.

I have attached the verified duty slip countersigned by the Placement Cell for your review. I would be deeply grateful if my absence for this slot could be recorded as an authorized event exemption.

Thank you for your time, consideration, and continued guidance.

Sincerely,
Alex Rivera
Roll No: CS-2025-A-042
Department of Computer Science & Engineering
Apex Institute of Technology`
  });

  const handleSynthesize = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedEmail({
        subject: `[Formal Request] Attendance Exemption for ${subject} on ${date}`,
        body: `Respected ${facultyName},

I am writing to formally submit an application regarding my attendance record for ${subject} on ${date}.

Reason for Absence: ${informalInput}

As per institutional guidelines regarding ${reasonCategory}, I request that my attendance vector for this session be updated under the authorized offline duty policy. All relevant proof documentation has been uploaded to the Academic Sync ledger portal for peer and administrative verification.

I remain committed to keeping up with all course assignments and lecture materials.

Respectfully yours,
Alex Rivera
CS-2025-A Cohort Node #042
Apex Institute of Technology`
      });
    }, 1200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 py-4">
      
      {/* Top Banner */}
      <div className="bg-[#121722] border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider block mb-1">
            AI ACADEMIC WELFARE & ATTENDANCE DEFENSE ENGINE
          </span>
          <h1 className="text-3xl font-extrabold text-white">AI Formal Communication Synthesizer</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Transform casual notes, medical events, or fest duty reasons into institutionally compliant, formal academic leave & defense emails using LLM synthesis.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-purple-950/60 border border-purple-800/60 px-4 py-2 rounded-xl text-xs font-mono text-purple-300 shrink-0">
          <Bot className="w-4 h-4 text-purple-400 animate-pulse" />
          <span>LLM-Engine: Gemini 2.5 Flash</span>
        </div>
      </div>

      {/* Main Grid: Input Form (Left) & Generated Draft (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form */}
        <div className="lg:col-span-5 bg-[#121722] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-white text-base flex items-center space-x-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Informal Input Parameters</span>
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">TARGET FACULTY NAME</label>
              <input
                type="text"
                value={facultyName}
                onChange={(e) => setFacultyName(e.target.value)}
                className="w-full bg-[#0B0E14] border border-slate-800 text-white rounded-xl p-3 outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">TARGET COURSE & CODE</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-[#0B0E14] border border-slate-800 text-white rounded-xl p-3 outline-none focus:border-purple-500"
              >
                <option>CS601 Distributed Systems</option>
                <option>CS602 Computer Networks</option>
                <option>CS609 Machine Learning & AI</option>
                <option>CS604 Compiler Engineering</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">ABSENCE DATE</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#0B0E14] border border-slate-800 text-white rounded-xl p-2.5 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">CATEGORY</label>
                <select
                  value={reasonCategory}
                  onChange={(e) => setReasonCategory(e.target.value)}
                  className="w-full bg-[#0B0E14] border border-slate-800 text-white rounded-xl p-2.5 outline-none"
                >
                  <option>Fest / Event Duty</option>
                  <option>Medical Exemption</option>
                  <option>Sports Representation</option>
                  <option>Personal Emergency</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">CASUAL REASON (RAW NOTE)</label>
              <textarea
                rows={4}
                value={informalInput}
                onChange={(e) => setInformalInput(e.target.value)}
                className="w-full bg-[#0B0E14] border border-slate-800 text-white rounded-xl p-3 outline-none focus:border-purple-500 font-sans text-xs leading-relaxed"
                placeholder="Type your casual reason here..."
              />
            </div>
          </div>

          <button
            onClick={handleSynthesize}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-purple-600/20 text-xs font-mono font-bold flex items-center justify-center space-x-2"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Synthesizing Formal Email...' : 'Synthesize Formal Email'}</span>
          </button>
        </div>

        {/* Right Output Draft */}
        <div className="lg:col-span-7 bg-[#121722] border border-purple-900/40 rounded-2xl p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">AI GENERATED DRAFT</span>
                <h3 className="font-bold text-white text-base">Polished Faculty Application</h3>
              </div>

              <button
                onClick={handleCopy}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-mono border border-slate-700 flex items-center space-x-1 transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Draft'}</span>
              </button>
            </div>

            {/* Subject line box */}
            <div className="bg-[#0B0E14] border border-slate-800 rounded-xl p-3 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">EMAIL SUBJECT LINE</span>
              <p className="font-mono text-xs font-bold text-cyan-300">{generatedEmail.subject}</p>
            </div>

            {/* Body Box */}
            <div className="bg-[#0B0E14] border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="text-[10px] font-mono text-slate-500 uppercase block mb-2">EMAIL BODY</span>
              <pre className="font-sans text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-normal">
                {generatedEmail.body}
              </pre>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <span className="text-slate-400 flex items-center space-x-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Compliant with Institutional Leave Standard Clause 8.2</span>
            </span>

            <div className="flex items-center space-x-2">
              <a
                href={`mailto:faculty@apex.edu?subject=${encodeURIComponent(generatedEmail.subject)}&body=${encodeURIComponent(generatedEmail.body)}`}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-all shadow-lg shadow-indigo-600/20"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Open in Mail Client</span>
              </a>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
