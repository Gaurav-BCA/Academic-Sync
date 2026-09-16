import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../context/OnboardingContext';
import { 
  Upload, 
  Sparkles, 
  Copy,
  UserCheck,
  BookOpen
} from 'lucide-react';

export const OverviewGateScreen: React.FC = () => {
  const navigate = useNavigate();
  const { completeOnboarding } = useOnboarding();
  
  // Student state
  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [tokenInput, setTokenInput] = useState('CS-8849');
  const [studentError, setStudentError] = useState('');

  // CR state
  const [institution, setInstitution] = useState('Apex Inst. of Tech');
  const [branch, setBranch] = useState('Computer Science & Eng');
  const [semester, setSemester] = useState('Sem VI');
  const [isParsing, setIsParsing] = useState(false);
  const [parseSuccess, setParseSuccess] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const handleCopyToken = () => {
    setTokenInput('CS-8849');
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleAutoParse = () => {
    setIsParsing(true);
    setTimeout(() => {
      setIsParsing(false);
      setParseSuccess(true);
      setTimeout(() => {
        completeOnboarding('cr', {
          institution: institution.trim() || 'Apex Inst. of Tech',
          branch: branch.trim() || 'Computer Science & Eng',
          semester: semester.trim() || 'Sem VI'
        });
        navigate('/dashboard');
      }, 1000);
    }, 1500);
  };

  const handleJoinBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setStudentError('Please enter your Full Name.');
      return;
    }
    if (!rollNumber.trim()) {
      setStudentError('Please enter your Roll Number / Student ID.');
      return;
    }
    if (!tokenInput.trim()) {
      setStudentError('Please enter a valid 6-digit Class Code.');
      return;
    }
    setStudentError('');
    completeOnboarding('student', {
      fullName: fullName.trim(),
      rollNumber: rollNumber.trim(),
      classCode: tokenInput.trim().toUpperCase()
    });
    navigate('/dashboard');
  };

  return (
    <div className="space-y-8 py-6 max-w-5xl mx-auto">
      {/* System Status Tag */}
      <div className="flex justify-center">
        <div className="inline-flex items-center space-x-2 bg-[#10B981]/10 border border-[#10B981]/30 px-3.5 py-1 rounded-full text-xs font-mono text-[#10B981]">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="tnum uppercase font-semibold">AcademicSync • Attendance Management</span>
        </div>
      </div>

      {/* Honest Hero Headline & Subtext */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-jakarta font-bold tracking-tight text-white">
          Smart Attendance Tracking & <span className="bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#6BD8CB] bg-clip-text text-transparent">Predictive Forecasting</span>
        </h1>
        <p className="text-sm text-[#94A3B8] leading-relaxed font-sans">
          Track your class attendance, calculate minimum attendance targets, and get intelligent forecasts to stay above your institution's requirement.
        </p>
      </div>

      {/* Main Two Gate Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Card: Join as Student */}
        <div className="stealth-card p-6 flex flex-col justify-between space-y-6">
          <form onSubmit={handleJoinBatch} className="space-y-4">
            <div className="flex items-center space-x-2 text-[#10B981]">
              <UserCheck className="w-5 h-5" />
              <span className="text-xs font-mono uppercase tracking-wider text-[#94A3B8]">Join as Student</span>
            </div>
            
            <div>
              <h2 className="text-xl font-jakarta font-bold text-white">Class Member Gate</h2>
              <p className="text-xs text-[#94A3B8] leading-relaxed mt-1">
                Enter your details and 6-digit class code to join your cohort and start tracking your attendance.
              </p>
            </div>

            {studentError && (
              <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 px-3 py-2 rounded text-xs text-[#EF4444] font-mono">
                {studentError}
              </div>
            )}

            {/* Field 1: Full Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-[#DFE2F1] uppercase block">
                Full Name <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="input-stealth w-full font-sans text-sm"
              />
            </div>

            {/* Field 2: Roll Number / Student ID */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-[#DFE2F1] uppercase block">
                Roll Number / Student ID <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="e.g. 21CS045"
                className="input-stealth w-full font-mono text-sm"
              />
            </div>

            {/* Field 3: 6-Digit Class Code */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                <label className="text-[11px] font-mono text-[#DFE2F1] uppercase block">
                  6-Digit Class Code <span className="text-[#EF4444]">*</span>
                </label>
                <button 
                  type="button"
                  onClick={handleCopyToken}
                  className="flex items-center space-x-1 text-[#6BD8CB] hover:text-white font-mono text-[11px]"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedToken ? 'Applied!' : 'Try: CS-8849'}</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                  placeholder="e.g. CS-8849"
                  className="input-stealth w-full font-mono text-sm tracking-wider uppercase"
                />
                {tokenInput && (
                  <button
                    type="button"
                    onClick={() => setTokenInput('')}
                    className="absolute right-3 top-2.5 text-xs text-[#64748B] hover:text-[#DFE2F1] font-mono"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 flex items-center justify-center space-x-2 text-xs uppercase tracking-wider font-semibold mt-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Join Class Batch</span>
            </button>
          </form>

          <div className="pt-4 border-t border-[#233044] text-[11px] text-[#64748B] font-mono text-center">
            Individual attendance record will be tracked under your student ID.
          </div>
        </div>

        {/* Right Card: Set up as CR */}
        <div className="stealth-card p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-[#8B5CF6]">
              <BookOpen className="w-5 h-5" />
              <span className="text-xs font-mono uppercase tracking-wider text-[#94A3B8]">Class Representative Setup</span>
            </div>

            <div>
              <h2 className="text-xl font-jakarta font-bold text-white">Class Representative Hub</h2>
              <p className="text-xs text-[#94A3B8] leading-relaxed mt-1">
                Establish your cohort's lecture schedule routine. Enter institution details and upload your timetable.
              </p>
            </div>

            {/* Free-text input fields for Institution, Branch, Semester */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-mono text-[#94A3B8] block mb-1 uppercase">INSTITUTION</label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. Apex Inst. of Tech"
                  className="input-stealth w-full font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#94A3B8] block mb-1 uppercase">BRANCH / DEPT</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. Comp. Sci. & Eng"
                  className="input-stealth w-full font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#94A3B8] block mb-1 uppercase">TERM / SEMESTER</label>
                <input
                  type="text"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  placeholder="e.g. Sem VI"
                  className="input-stealth w-full font-mono text-xs"
                />
              </div>
            </div>

            {/* Drag and Drop Zone */}
            <div 
              onClick={handleAutoParse}
              className="border border-dashed border-[#233044] hover:border-[#6366F1] bg-[#161F30] rounded p-5 text-center cursor-pointer transition-colors space-y-2 group"
            >
              <Upload className="w-6 h-6 mx-auto text-[#8B5CF6] transition-transform group-hover:scale-110" />
              <p className="text-xs text-[#DFE2F1] font-medium">Click to upload schedule routine image or document</p>
              <p className="text-[10px] text-[#64748B] font-mono">Supports JPG, PNG, PDF with automated AI schedule extraction</p>
            </div>

            <button
              onClick={handleAutoParse}
              disabled={isParsing}
              className="btn-stealth w-full py-3 flex items-center justify-center space-x-2 text-xs font-mono uppercase font-semibold"
            >
              <Sparkles className={`w-4 h-4 text-[#8B5CF6] ${isParsing ? 'animate-spin' : ''}`} />
              <span>{isParsing ? 'Parsing Timetable with AI...' : parseSuccess ? 'Timetable Parsed! Launching...' : 'Auto-Parse Timetable with AI'}</span>
            </button>
          </div>

          <div className="pt-4 border-t border-[#233044] text-[11px] text-[#64748B] font-mono text-center">
            Generates a 6-digit class code to share with your classmates.
          </div>
        </div>

      </div>

    </div>
  );
};

