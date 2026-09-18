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
import { db } from '../services/firebase';
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { TIMETABLE_MATRIX } from '../data/mockData';

export const OverviewGateScreen: React.FC = () => {
  const navigate = useNavigate();
  const { completeOnboarding } = useOnboarding();
  
  // Tab switcher state ('student' by default)
  const [activeTab, setActiveTab] = useState<'student' | 'coordinator'>('student');

  // Student state
  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [tokenInput, setTokenInput] = useState('CS-8849');
  const [studentError, setStudentError] = useState('');

  // Class Coordinator state
  const [coordinatorName, setCoordinatorName] = useState('Prof. S. Chakrabarti');
  const [institution, setInstitution] = useState('Apex Inst. of Tech');
  const [branch, setBranch] = useState('Computer Science & Eng');
  const [semester, setSemester] = useState('Sem VI');
  const [coordinatorError, setCoordinatorError] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseSuccess, setParseSuccess] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const handleCopyToken = () => {
    setTokenInput('CS-8849');
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleAutoParse = async () => {
    if (!coordinatorName.trim()) {
      setCoordinatorError('Please enter Coordinator / Teacher Full Name.');
      return;
    }
    setCoordinatorError('');
    setIsParsing(true);
    const classCode = tokenInput || 'CS-8849';
    try {
      // Save batch document to Firestore
      await setDoc(doc(db, "batches", classCode), {
        classCode: classCode,
        coordinatorName: coordinatorName.trim(),
        institution: institution.trim() || 'Apex Inst. of Tech',
        branch: branch.trim() || 'Computer Science & Eng',
        term: semester.trim() || 'Sem VI',
        timetable: TIMETABLE_MATRIX,
        createdAt: serverTimestamp()
      }, { merge: true });

      // Save user record to Firestore 'users' collection
      await addDoc(collection(db, "users"), {
        name: coordinatorName.trim(),
        rollNumber: "COORDINATOR",
        classCode: classCode,
        role: "coordinator",
        institution: institution.trim() || 'Apex Inst. of Tech',
        branch: branch.trim() || 'Computer Science & Eng',
        semester: semester.trim() || 'Sem VI',
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("Firestore batch save warning:", err);
    }

    setTimeout(() => {
      setIsParsing(false);
      setParseSuccess(true);
      setTimeout(() => {
        completeOnboarding('coordinator', {
          fullName: coordinatorName.trim(),
          institution: institution.trim() || 'Apex Inst. of Tech',
          branch: branch.trim() || 'Computer Science & Eng',
          semester: semester.trim() || 'Sem VI'
        });
        navigate('/dashboard');
      }, 1000);
    }, 1200);
  };

  const handleJoinBatch = async (e: React.FormEvent) => {
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

    const formattedCode = tokenInput.trim().toUpperCase();
    try {
      await addDoc(collection(db, "users"), {
        name: fullName.trim(),
        rollNumber: rollNumber.trim(),
        classCode: formattedCode,
        role: "student",
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("Firestore user save warning:", err);
    }

    completeOnboarding('student', {
      fullName: fullName.trim(),
      rollNumber: rollNumber.trim(),
      classCode: formattedCode
    });
    navigate('/dashboard');
  };

  return (
    <div className="space-y-8 py-6 max-w-4xl mx-auto">
      {/* System Status Tag */}
      <div className="flex justify-center">
        <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200/80 px-4 py-1.5 rounded-full text-xs font-mono text-emerald-700 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="tnum uppercase font-semibold">AcademicSync • Attendance Management</span>
        </div>
      </div>

      {/* Hero Headline & Subtext */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-jakarta font-bold tracking-tight text-neutral-900">
          Smart Attendance Tracking & <span className="bg-gradient-to-r from-[#FF6B4B] via-[#F59E0B] to-[#10B981] bg-clip-text text-transparent">Predictive Forecasting</span>
        </h1>
        <p className="text-sm text-neutral-600 leading-relaxed font-sans max-w-xl mx-auto">
          Track your class attendance, calculate minimum attendance targets, and get intelligent forecasts to stay above your institution's requirement.
        </p>
      </div>

      {/* Centered Sleek Tab Switcher Pill */}
      <div className="flex justify-center">
        <div className="bg-white border border-amber-200/70 p-1.5 rounded-full inline-flex items-center space-x-2 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('student')}
            className={`px-6 py-2.5 rounded-full text-xs font-mono uppercase tracking-wider font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'student'
                ? 'bg-[#FF6B4B] text-white shadow-md shadow-orange-500/25'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-amber-50/50'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Student Gate</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('coordinator')}
            className={`px-6 py-2.5 rounded-full text-xs font-mono uppercase tracking-wider font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'coordinator'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-amber-50/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Class Coordinator Hub</span>
          </button>
        </div>
      </div>

      {/* Main Single Centered Gate Card Container */}
      <div className="max-w-xl mx-auto">
        {activeTab === 'student' ? (
          /* Student Gate Card */
          <div className="stealth-card p-8 flex flex-col justify-between space-y-6 animate-fade-in border border-amber-100 shadow-xl shadow-amber-900/5">
            <form onSubmit={handleJoinBatch} className="space-y-4">
              <div className="flex items-center space-x-2 text-emerald-600">
                <UserCheck className="w-5 h-5" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">Join as Student</span>
              </div>
              
              <div>
                <h2 className="text-2xl font-jakarta font-bold text-neutral-900">Class Member Gate</h2>
                <p className="text-xs text-neutral-600 leading-relaxed mt-1">
                  Enter your details and 6-digit class code to join your cohort and start tracking your attendance.
                </p>
              </div>

              {studentError && (
                <div className="bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl text-xs text-rose-600 font-mono">
                  {studentError}
                </div>
              )}

              {/* Field 1: Full Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-neutral-700 uppercase block font-semibold">
                  Full Name <span className="text-rose-500">*</span>
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
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-neutral-700 uppercase block font-semibold">
                  Roll Number / Student ID <span className="text-rose-500">*</span>
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
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs text-neutral-600">
                  <label className="text-[11px] font-mono text-neutral-700 uppercase block font-semibold">
                    6-Digit Class Code <span className="text-rose-500">*</span>
                  </label>
                  <button 
                    type="button"
                    onClick={handleCopyToken}
                    className="flex items-center space-x-1 text-[#FF6B4B] hover:text-orange-600 font-mono text-[11px] font-bold"
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
                    className="input-stealth w-full font-mono text-sm tracking-wider uppercase font-bold"
                  />
                  {tokenInput && (
                    <button
                      type="button"
                      onClick={() => setTokenInput('')}
                      className="absolute right-3 top-3 text-xs text-neutral-400 hover:text-neutral-700 font-mono"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3.5 flex items-center justify-center space-x-2 text-xs uppercase tracking-wider font-bold mt-3 shadow-md"
              >
                <UserCheck className="w-4 h-4" />
                <span>Join Class Batch</span>
              </button>
            </form>

            <div className="pt-4 border-t border-amber-100 text-[11px] text-neutral-500 font-mono text-center">
              Individual attendance record will be tracked under your student ID.
            </div>
          </div>
        ) : (
          /* Class Coordinator Setup Card */
          <div className="stealth-card p-8 flex flex-col justify-between space-y-6 animate-fade-in border border-amber-100 shadow-xl shadow-amber-900/5">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-indigo-600">
                <BookOpen className="w-5 h-5" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">Class Coordinator Setup</span>
              </div>

              <div>
                <h2 className="text-2xl font-jakarta font-bold text-neutral-900">Class Coordinator Hub</h2>
                <p className="text-xs text-neutral-600 leading-relaxed mt-1">
                  Establish your cohort's lecture schedule routine. Enter coordinator name, institution details and upload your timetable.
                </p>
              </div>

              {coordinatorError && (
                <div className="bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl text-xs text-rose-600 font-mono">
                  {coordinatorError}
                </div>
              )}

              {/* Coordinator Full Name Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-neutral-700 uppercase block font-semibold">
                  Coordinator / Teacher Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={coordinatorName}
                  onChange={(e) => setCoordinatorName(e.target.value)}
                  placeholder="e.g. Prof. S. Chakrabarti"
                  className="input-stealth w-full font-sans text-sm"
                />
              </div>

              {/* Free-text input fields for Institution, Branch, Semester */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-neutral-600 block mb-1 uppercase font-semibold">INSTITUTION</label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. Apex Inst. of Tech"
                    className="input-stealth w-full font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-neutral-600 block mb-1 uppercase font-semibold">BRANCH / DEPT</label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="e.g. Comp. Sci. & Eng"
                    className="input-stealth w-full font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-neutral-600 block mb-1 uppercase font-semibold">TERM / SEMESTER</label>
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
                className="border border-dashed border-amber-200/90 hover:border-[#FF6B4B] bg-amber-50/40 rounded-2xl p-5 text-center cursor-pointer transition-colors space-y-2 group"
              >
                <Upload className="w-6 h-6 mx-auto text-[#FF6B4B] transition-transform group-hover:scale-110" />
                <p className="text-xs text-neutral-800 font-semibold">Click to upload schedule routine image or document</p>
                <p className="text-[10px] text-neutral-500 font-mono">Supports JPG, PNG, PDF with automated AI schedule extraction</p>
              </div>

              <button
                onClick={handleAutoParse}
                disabled={isParsing}
                className="btn-stealth w-full py-3.5 flex items-center justify-center space-x-2 text-xs font-mono uppercase font-bold shadow-xs"
              >
                <Sparkles className={`w-4 h-4 text-[#FF6B4B] ${isParsing ? 'animate-spin' : ''}`} />
                <span>{isParsing ? 'Parsing Timetable with AI...' : parseSuccess ? 'Timetable Parsed! Launching...' : 'Auto-Parse Timetable with AI'}</span>
              </button>
            </div>

            <div className="pt-4 border-t border-amber-100 text-[11px] text-neutral-500 font-mono text-center">
              Generates a 6-digit class code to share with your classmates.
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
