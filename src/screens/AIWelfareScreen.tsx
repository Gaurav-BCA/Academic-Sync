import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  FileText, 
  Mail, 
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AIWelfareScreen: React.FC = () => {
  const { userProfile } = useApp();

  const [facultyName, setFacultyName] = useState('Dr. R. Sharma');
  const [subject, setSubject] = useState('CS601 Distributed Core Systems');
  const [date, setDate] = useState('2026-09-17');
  const [reasonCategory, setReasonCategory] = useState('Fest / Event Duty');
  const [informalInput, setInformalInput] = useState(
    'Missed session due to NSS placement drive coordination duty at Main Auditorium. Needed to assist 3rd year students. Requesting formal leave credit.'
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const studentName = userProfile.fullName || 'Gaurav Bisht';
  const rollNumber = userProfile.rollNumber || '21CS045';

  const [generatedEmail, setGeneratedEmail] = useState({
    subject: 'Request for Attendance Reinstatement — Distributed Core Systems (CS601)',
    body: `Respected Dr. R. Sharma,

I am writing to formally request attendance reinstatement for the Distributed Core Systems (CS601) lecture conducted on September 17, 2026. 

On the specified date, I was officially assigned to duty representing the institution at the NSS Placement Drive in the Main Auditorium, pursuant to official institutional approval.

I have attached the verified duty slip countersigned by the Placement Cell for your review. I would be deeply grateful if my absence for this lecture could be recorded as authorized duty leave.

Thank you for your time, consideration, and continued guidance.

Sincerely,
${studentName}
Roll No: ${rollNumber}
Department of Computer Science & Engineering
Apex Institute of Technology`
  });

  const handleSynthesize = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedEmail({
        subject: `[Formal Request] Attendance Exception for ${subject} on ${date}`,
        body: `Respected ${facultyName},

I am writing to formally submit an application regarding my attendance record for ${subject} conducted on ${date}.

Reason for Absence / Duty: ${informalInput}

As per institutional guidelines regarding ${reasonCategory}, I request that my attendance record for this session be updated under the authorized duty/medical leave policy. Relevant proof documentation is attached for your verification.

I remain committed to keeping up with all course assignments and class requirements.

Respectfully yours,
${studentName}
Roll No: ${rollNumber}
Department of Computer Science & Engineering
Apex Institute of Technology`
      });
      setToastMessage('Formal leave application draft generated!');
      setTimeout(() => setToastMessage(null), 3500);
    }, 1200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`);
    setCopied(true);
    setToastMessage('Copied draft to clipboard!');
    setTimeout(() => {
      setCopied(false);
      setToastMessage(null);
    }, 2500);
  };

  return (
    <div className="space-y-6 py-4 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-[#10B981]/90 text-white font-mono text-xs px-4 py-3 rounded shadow-lg border border-[#10B981] flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
      
      {/* Top Banner */}
      <div className="stealth-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono text-[#8B5CF6] uppercase tracking-wider block mb-1 tnum">
            AI ACADEMIC LEAVE APPLICATION ASSISTANT
          </span>
          <h1 className="text-xl font-jakarta font-bold text-white">Academic Leave Application Draft Generator</h1>
          <p className="text-xs text-[#94A3B8] mt-1 max-w-2xl font-sans">
            Transform casual notes, medical events, or fest duty reasons into formal academic leave applications.
          </p>
        </div>
      </div>

      {/* Main Grid: Input Form (Left) & Generated Draft (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form */}
        <div className="lg:col-span-5 stealth-card p-6 space-y-4">
          <h3 className="font-jakarta font-bold text-white text-base flex items-center space-x-2">
            <FileText className="w-4 h-4 text-[#6BD8CB]" />
            <span>Informal Input Parameters</span>
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="text-[10px] text-[#94A3B8] block mb-1">TARGET FACULTY NAME</label>
              <input
                type="text"
                value={facultyName}
                onChange={(e) => setFacultyName(e.target.value)}
                className="input-stealth w-full font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] text-[#94A3B8] block mb-1">TARGET MODULE & CODE</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input-stealth w-full font-mono text-xs"
              >
                <option>CS601 Distributed Core Systems</option>
                <option>CS602 Computer Networks</option>
                <option>CS609 Machine Learning & AI</option>
                <option>CS604 Compiler Engineering</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-[#94A3B8] block mb-1">ABSENCE DATE</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-stealth w-full font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#94A3B8] block mb-1">CATEGORY</label>
                <select
                  value={reasonCategory}
                  onChange={(e) => setReasonCategory(e.target.value)}
                  className="input-stealth w-full font-mono text-xs"
                >
                  <option>Fest / Event Duty</option>
                  <option>Medical Exemption</option>
                  <option>Sports Representation</option>
                  <option>Personal Emergency</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[#94A3B8] block mb-1">CASUAL REASON (RAW NOTE)</label>
              <textarea
                rows={4}
                value={informalInput}
                onChange={(e) => setInformalInput(e.target.value)}
                className="w-full bg-[#161F30] border border-[#233044] text-[#F8FAFC] rounded p-3 outline-none focus:border-[#6366F1] font-sans text-xs leading-relaxed"
                placeholder="Type your casual reason here..."
              />
            </div>
          </div>

          <button
            onClick={handleSynthesize}
            disabled={isGenerating}
            className="btn-primary w-full py-2.5 text-xs font-mono font-bold uppercase flex items-center justify-center space-x-2"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Synthesizing Formal Email...' : 'Synthesize Formal Application'}</span>
          </button>
        </div>

        {/* Right Output Draft */}
        <div className="lg:col-span-7 stealth-card p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#233044]">
              <div>
                <span className="text-[10px] font-mono text-[#10B981] uppercase tracking-wider block">AI GENERATED DRAFT</span>
                <h3 className="font-jakarta font-bold text-white text-base">Polished Faculty Application</h3>
              </div>

              <button
                onClick={handleCopy}
                className="btn-stealth px-3 py-1.5 text-xs font-mono flex items-center space-x-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Draft'}</span>
              </button>
            </div>

            {/* Subject line box */}
            <div className="bg-[#161F30] border border-[#233044] rounded p-3 space-y-1">
              <span className="text-[10px] font-mono text-[#64748B] uppercase block">EMAIL SUBJECT LINE</span>
              <p className="font-mono text-xs font-bold text-[#6BD8CB] tnum">{generatedEmail.subject}</p>
            </div>

            {/* Body Box */}
            <div className="bg-[#161F30] border border-[#233044] rounded p-4 space-y-2">
              <span className="text-[10px] font-mono text-[#64748B] uppercase block mb-1">EMAIL BODY</span>
              <pre className="font-sans text-xs text-[#DFE2F1] leading-relaxed whitespace-pre-wrap font-normal">
                {generatedEmail.body}
              </pre>
            </div>
          </div>

          <div className="pt-4 border-t border-[#233044] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <span className="text-[#94A3B8] text-xs">
              This is a draft — please review before sending.
            </span>

            <div className="flex items-center space-x-2">
              <a
                href={`mailto:faculty@apex.edu?subject=${encodeURIComponent(generatedEmail.subject)}&body=${encodeURIComponent(generatedEmail.body)}`}
                className="btn-primary px-3.5 py-1.5 text-xs font-mono uppercase flex items-center space-x-1.5"
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
