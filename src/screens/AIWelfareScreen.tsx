import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  FileText, 
  Mail, 
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useOnboarding } from '../context/OnboardingContext';

export const AIWelfareScreen: React.FC = () => {
  const { userProfile, subjects: appSubjects } = useApp();
  const { studentProfile, coordinatorProfile } = useOnboarding();

  const [facultyName, setFacultyName] = useState('Mrs. Meenakshi Manchanda');
  const [subject, setSubject] = useState('BCA 512 Java Programming');
  const [date, setDate] = useState('2026-09-17');
  const [reasonCategory, setReasonCategory] = useState('Fest / Event Duty');
  const [informalInput, setInformalInput] = useState(
    'Missed session due to NSS placement drive coordination duty at Main Auditorium. Needed to assist 3rd year students. Requesting formal leave credit.'
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const studentName = studentProfile?.fullName || coordinatorProfile?.fullName || userProfile.fullName || 'Student';
  const rollNumber = studentProfile?.rollNumber || userProfile.rollNumber || 'Student ID';

  const [generatedEmail, setGeneratedEmail] = useState({
    subject: 'Request for Attendance Reinstatement — Java Programming (BCA 512)',
    body: `Respected Mrs. Meenakshi Manchanda,

I am writing to formally request attendance reinstatement for the Java Programming (BCA 512) lecture conducted on September 17, 2026. 

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
    <div className="space-y-6 py-4 relative max-w-[1240px] mx-auto">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white font-mono text-xs px-5 py-3.5 rounded-2xl shadow-xl border border-emerald-500 flex items-center space-x-2.5 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-white" />
          <span className="font-bold">{toastMessage}</span>
        </div>
      )}
      
      {/* Top Banner */}
      <div className="stealth-card p-6 bg-white border border-amber-100 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono text-indigo-800 bg-indigo-100 border border-indigo-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold block w-max mb-1.5 tnum">
            AI ACADEMIC LEAVE APPLICATION ASSISTANT
          </span>
          <h1 className="text-2xl font-jakarta font-bold text-neutral-900">Academic Leave Application Draft Generator</h1>
          <p className="text-xs text-neutral-600 mt-1 max-w-2xl font-sans">
            Transform casual notes, medical events, or fest duty reasons into formal academic leave applications.
          </p>
        </div>
      </div>

      {/* Main Grid: Input Form (Left) & Generated Draft (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form */}
        <div className="lg:col-span-5 stealth-card p-6 space-y-4 bg-white border border-amber-100 rounded-3xl shadow-sm">
          <h3 className="font-jakarta font-bold text-neutral-900 text-base flex items-center space-x-2 border-b border-amber-100 pb-3">
            <FileText className="w-4 h-4 text-[#FF6B4B]" />
            <span>Informal Input Parameters</span>
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="text-[10px] text-neutral-600 block mb-1 uppercase font-bold">TARGET FACULTY NAME</label>
              <input
                type="text"
                value={facultyName}
                onChange={(e) => setFacultyName(e.target.value)}
                className="input-stealth w-full font-mono text-xs bg-white border-amber-200"
              />
            </div>

            <div>
              <label className="text-[10px] text-neutral-600 block mb-1 uppercase font-bold">TARGET MODULE & CODE</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input-stealth w-full font-mono text-xs bg-white border-amber-200"
              >
                {appSubjects && appSubjects.length > 0 ? (
                  appSubjects.map(s => (
                    <option key={s.id} value={`${s.code} ${s.name}`}>{s.code} {s.name}</option>
                  ))
                ) : (
                  <>
                    <option>BCA 512 Java Programming</option>
                    <option>BCA 513 Computer Graphics</option>
                    <option>BCA 514 Software Engineering</option>
                    <option>BCA 515 Web Technologies</option>
                  </>
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-neutral-600 block mb-1 uppercase font-bold">ABSENCE DATE</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-stealth w-full font-mono text-xs bg-white border-amber-200"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-600 block mb-1 uppercase font-bold">CATEGORY</label>
                <select
                  value={reasonCategory}
                  onChange={(e) => setReasonCategory(e.target.value)}
                  className="input-stealth w-full font-mono text-xs bg-white border-amber-200"
                >
                  <option>Fest / Event Duty</option>
                  <option>Medical Exemption</option>
                  <option>Sports Representation</option>
                  <option>Personal Emergency</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-neutral-600 block mb-1 uppercase font-bold">CASUAL REASON (RAW NOTE)</label>
              <textarea
                rows={4}
                value={informalInput}
                onChange={(e) => setInformalInput(e.target.value)}
                className="w-full bg-amber-50/50 border border-amber-200/80 text-neutral-900 rounded-2xl p-3.5 outline-none focus:border-[#FF6B4B] focus:ring-2 focus:ring-orange-200 font-sans text-xs leading-relaxed"
                placeholder="Type your casual reason here..."
              />
            </div>
          </div>

          <button
            onClick={handleSynthesize}
            disabled={isGenerating}
            className="btn-primary w-full py-3 text-xs font-mono font-bold uppercase flex items-center justify-center space-x-2 shadow-md"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Synthesizing Formal Email...' : 'Synthesize Formal Application'}</span>
          </button>
        </div>

        {/* Right Output Draft */}
        <div className="lg:col-span-7 stealth-card p-6 space-y-4 flex flex-col justify-between bg-white border border-amber-100 rounded-3xl shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <div>
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">AI GENERATED DRAFT</span>
                <h3 className="font-jakarta font-bold text-neutral-900 text-base mt-1">Polished Faculty Application</h3>
              </div>

              <button
                onClick={handleCopy}
                className="btn-stealth px-3.5 py-1.5 text-xs font-mono flex items-center space-x-1.5 font-bold shadow-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Draft'}</span>
              </button>
            </div>

            {/* Subject line box */}
            <div className="bg-amber-50/60 border border-amber-200/70 rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold block">EMAIL SUBJECT LINE</span>
              <p className="font-mono text-xs font-bold text-[#FF6B4B] tnum">{generatedEmail.subject}</p>
            </div>

            {/* Body Box */}
            <div className="bg-amber-50/50 border border-amber-200/70 rounded-2xl p-4.5 space-y-2">
              <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold block mb-1">EMAIL BODY</span>
              <pre className="font-sans text-xs text-neutral-800 leading-relaxed whitespace-pre-wrap font-medium">
                {generatedEmail.body}
              </pre>
            </div>
          </div>

          <div className="pt-4 border-t border-amber-100 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <span className="text-neutral-500 text-xs font-medium">
              This is a draft — please review before sending.
            </span>

            <div className="flex items-center space-x-2">
              <a
                href={`mailto:faculty@apex.edu?subject=${encodeURIComponent(generatedEmail.subject)}&body=${encodeURIComponent(generatedEmail.body)}`}
                className="btn-primary px-4 py-2 text-xs font-mono uppercase flex items-center space-x-2 font-bold shadow-md"
              >
                <Mail className="w-4 h-4" />
                <span>Open in Mail Client</span>
              </a>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
