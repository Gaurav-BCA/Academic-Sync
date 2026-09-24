import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../context/OnboardingContext';
import {
  Upload,
  Sparkles,
  Copy,
  UserCheck,
  BookOpen,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Hash,
  FileImage,
  CheckCircle2,
  LogIn,
  UserPlus,
  Award,
  Building,
  AlertCircle
} from 'lucide-react';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { parseTimetableWithGemini, ParsedDaySchedule, ParsedSubject } from '../services/geminiService';
import { Toast, ToastMessage } from '../components/Toast';

interface OverviewGateScreenProps {
  mode?: 'student' | 'faculty';
}

export const OverviewGateScreen: React.FC<OverviewGateScreenProps> = ({ mode = 'student' }) => {
  const navigate = useNavigate();
  const { completeOnboarding, resetOnboarding } = useOnboarding();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Toast state
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Tab switcher state ('student' for student mode, 'teacher' for faculty mode by default)
  const [activeTab, setActiveTab] = useState<'student' | 'coordinator' | 'teacher'>(
    mode === 'faculty' ? 'teacher' : 'student'
  );

  // Pending teacher alert card state
  const [pendingApprovalNotice, setPendingApprovalNotice] = useState<string | null>(null);

  // Dynamic Toggle Mode state (false = Sign Up, true = Sign In)
  const [isStudentSignIn, setIsStudentSignIn] = useState(false);
  const [isCoordSignIn, setIsCoordSignIn] = useState(false);
  const [isTeacherSignIn, setIsTeacherSignIn] = useState(false);

  // Student state & password visibility toggle
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [isStudentLoading, setIsStudentLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Class Coordinator state & password visibility toggle
  const [coordEmail, setCoordEmail] = useState('');
  const [coordPassword, setCoordPassword] = useState('');
  const [showCoordPassword, setShowCoordPassword] = useState(false);
  const [coordinatorName, setCoordinatorName] = useState('Prof. S. Chakrabarti');
  const [institution, setInstitution] = useState('Apex Inst. of Tech');
  const [branch, setBranch] = useState('Computer Science & Eng');
  const [semester, setSemester] = useState('Semester V');

  // Teacher Hub state & password visibility toggle
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [showTeacherPassword, setShowTeacherPassword] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [teacherDepartment, setTeacherDepartment] = useState('BCA');
  const [isTeacherLoading, setIsTeacherLoading] = useState(false);
  
  // Real Gemini AI Timetable OCR parsing state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isCoordSubmitting, setIsCoordSubmitting] = useState(false);
  const [parsedTimetable, setParsedTimetable] = useState<ParsedDaySchedule[] | null>(null);
  const [parsedSubjects, setParsedSubjects] = useState<ParsedSubject[] | null>(null);
  const [_generatedClassCode, setGeneratedClassCode] = useState<string>('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const showToast = (type: 'error' | 'success' | 'info', message: string, title?: string) => {
    setToast({ id: String(Date.now()), type, message, title });
  };

  // Helper to format email username into capitalized full name
  const deriveNameFromEmail = (email: string, fallbackRoleName: string): string => {
    if (!email || !email.includes('@')) return fallbackRoleName;
    const parts = email.split('@')[0].replace(/[._-]/g, ' ').trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return fallbackRoleName;
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
  };

  // ──────────────────────────────────────────
  // 1. STUDENT GATE SUBMISSION (SIGN UP & SIGN IN)
  // ──────────────────────────────────────────
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentEmail.trim()) {
      showToast('error', 'Please enter your Email Address.');
      return;
    }
    if (!studentPassword.trim()) {
      showToast('error', 'Please enter your Password.');
      return;
    }

    setIsStudentLoading(true);

    if (isStudentSignIn) {
      // ── SIGN IN MODE ──
      try {
        const userCred = await signInWithEmailAndPassword(auth, studentEmail.trim(), studentPassword.trim());
        const uid = userCred.user.uid;

        // Retrieve student profile from Firestore users/{uid}
        const userSnap = await getDoc(doc(db, 'users', uid));
        let sName = '';
        let sRoll = '21CS045';
        let sCode = 'CS-4051';

        if (userSnap.exists()) {
          const data = userSnap.data();
          const registeredRole = data.role;

          // STRICT ROLE GUARD FOR STUDENT GATE
          if (registeredRole && registeredRole !== 'student') {
            await auth.signOut();
            resetOnboarding();
            setIsStudentSignIn(true);
            setStudentPassword('');
            showToast('error', 'Access Denied: Faculty and Coordinator accounts cannot log in via Student Gate.', 'Access Denied');
            setIsStudentLoading(false);
            return;
          }

          sName = data.name || data.fullName || '';
          sRoll = data.rollNumber || '21CS045';
          sCode = data.classCode || 'CS-4051';
        }

        // Recover missing profile gracefully from Auth metadata if DB record is absent
        if (!sName) {
          sName = userCred.user.displayName?.trim() || deriveNameFromEmail(studentEmail.trim(), 'Student');
          // Auto-repair missing user record in Firestore
          await setDoc(doc(db, 'users', uid), {
            uid,
            name: sName,
            rollNumber: sRoll,
            email: studentEmail.trim(),
            classCode: sCode,
            role: 'student',
            createdAt: serverTimestamp()
          }, { merge: true });
        }

        showToast('success', `Welcome back, ${sName}! Signed in successfully.`);
        completeOnboarding('student', {
          uid,
          email: studentEmail.trim(),
          fullName: sName,
          rollNumber: sRoll,
          classCode: sCode
        });

        setTimeout(() => navigate('/dashboard'), 800);
      } catch (err: any) {
        console.error('Student sign-in error:', err);
        setIsStudentSignIn(true);
        setStudentPassword('');
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          showToast('error', 'Wrong Password. Please verify your credentials and try again.', 'Sign In Failed');
        } else if (err.code === 'auth/user-not-found') {
          showToast('error', 'No account found with this email. Please switch to Sign Up mode to register.', 'Account Not Found');
        } else {
          showToast('error', err.message || 'Failed to sign in. Please check your credentials.', 'Sign In Error');
        }
      } finally {
        setIsStudentLoading(false);
      }
    } else {
      // ── SIGN UP MODE ──
      if (!fullName.trim()) {
        showToast('error', 'Please enter your Full Name.');
        setIsStudentLoading(false);
        return;
      }
      if (!rollNumber.trim()) {
        showToast('error', 'Please enter your Roll Number / Student ID.');
        setIsStudentLoading(false);
        return;
      }
      if (!tokenInput.trim()) {
        showToast('error', 'Please enter a valid 6-digit Class Code.');
        setIsStudentLoading(false);
        return;
      }

      const formattedCode = tokenInput.trim().toUpperCase();

      try {
        // Strict Firestore Batch Code existence verification
        const batchSnap = await getDoc(doc(db, 'batches', formattedCode));

        if (!batchSnap.exists()) {
          setIsStudentLoading(false);
          showToast('error', 'Invalid Batch Code! No active cohort found for this code. Contact your Class Coordinator.', 'Invalid Batch Code');
          return;
        }

        // Firebase Auth Create User
        const userCred = await createUserWithEmailAndPassword(auth, studentEmail.trim(), studentPassword.trim());
        const uid = userCred.user.uid;

        // Save doc to Firestore users/{uid}
        await setDoc(doc(db, 'users', uid), {
          uid,
          name: fullName.trim(),
          rollNumber: rollNumber.trim(),
          email: studentEmail.trim(),
          classCode: formattedCode,
          role: 'student',
          createdAt: serverTimestamp()
        }, { merge: true });

        showToast('success', `Account created! Joined batch ${formattedCode} successfully.`);
        completeOnboarding('student', {
          uid,
          email: studentEmail.trim(),
          fullName: fullName.trim(),
          rollNumber: rollNumber.trim(),
          classCode: formattedCode
        });

        setTimeout(() => navigate('/dashboard'), 800);
      } catch (err: any) {
        console.error('Student sign-up error:', err);
        if (err.code === 'auth/email-already-in-use') {
          showToast('info', 'An account already exists for this email. Switched to Sign In mode.', 'Account Exists');
          setIsStudentSignIn(true);
        } else {
          showToast('error', err.message || 'Registration failed. Please check your inputs.', 'Registration Error');
        }
      } finally {
        setIsStudentLoading(false);
      }
    }
  };

  // ──────────────────────────────────────────
  // 2. REAL GEMINI 2.5 FLASH API TIMETABLE OCR PARSING
  // ──────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAutoParseTimetable = async () => {
    if (!selectedFile) {
      fileInputRef.current?.click();
      return;
    }

    setIsParsing(true);
    try {
      const result = await parseTimetableWithGemini(selectedFile);
      setParsedSubjects(result.subjects);
      setParsedTimetable(result.timetable);
      setIsReviewModalOpen(true);
      if (result.isFallback) {
        showToast('info', 'Gemini API unavailable (403/Quota). Loaded standard timetable OCR fallback parser.', 'OCR Fallback Parser');
      } else {
        showToast('success', 'AI Timetable OCR completed! Please review and verify the schedule.', 'Timetable Parsed');
      }
    } catch (err: any) {
      console.error('Gemini API OCR error:', err);
      showToast('error', err.message || 'AI Parsing Failed — Please upload a clear timetable PDF or Image document and retry.', 'AI Parsing Failed');
    } finally {
      setIsParsing(false);
    }
  };

  // ──────────────────────────────────────────
  // 3. COORDINATOR SUBMISSION & FIRESTORE BATCH PERSISTENCE
  // ──────────────────────────────────────────
  const handleCoordSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!coordEmail.trim()) {
      showToast('error', 'Please enter Coordinator Email Address.');
      return;
    }
    if (!coordPassword.trim()) {
      showToast('error', 'Please enter Coordinator Password.');
      return;
    }

    setIsCoordSubmitting(true);

    if (isCoordSignIn) {
      // ── SIGN IN MODE ──
      try {
        const userCred = await signInWithEmailAndPassword(auth, coordEmail.trim(), coordPassword.trim());
        const uid = userCred.user.uid;

        // Fetch coordinator user profile from Firestore users/{uid}
        const userSnap = await getDoc(doc(db, 'users', uid));
        let cName = '';
        let cInst = 'Apex Inst. of Tech';
        let cBranch = 'Computer Science & Eng';
        let cTerm = 'Semester V';
        let cCode = 'CS-4051';

        if (userSnap.exists()) {
          const data = userSnap.data();
          const registeredRole = data.role;

          // STRICT ROLE GUARD FOR COORDINATOR HUB
          if (registeredRole === 'student') {
            await auth.signOut();
            resetOnboarding();
            setActiveTab('coordinator');
            setIsCoordSignIn(true);
            setCoordPassword('');
            showToast('error', 'Access Denied: Student accounts are restricted from the Faculty Portal.', 'Access Denied');
            setIsCoordSubmitting(false);
            return;
          }

          if (registeredRole && registeredRole !== 'coordinator') {
            await auth.signOut();
            resetOnboarding();
            setActiveTab('coordinator');
            setIsCoordSignIn(true);
            setCoordPassword('');
            showToast('error', 'Access Denied: Only Class Coordinators can access this tab.', 'Access Denied');
            setIsCoordSubmitting(false);
            return;
          }

          cName = data.name || data.fullName || '';
          cInst = data.institution || 'Apex Inst. of Tech';
          cBranch = data.branch || 'Computer Science & Eng';
          cTerm = data.semester || data.term || 'Semester V';
          if (data.classCode) cCode = data.classCode;
        }

        // Query Firestore batches to find coordinator batch
        const batchesRef = collection(db, 'batches');
        const q = query(batchesRef, where('coordinatorUid', '==', uid));
        const batchQuerySnap = await getDocs(q);

        if (!batchQuerySnap.empty) {
          const firstBatch = batchQuerySnap.docs[0].data();
          cCode = firstBatch.classCode || cCode;
        }

        // Recover missing profile gracefully if DB record is missing
        if (!cName) {
          cName = userCred.user.displayName?.trim() || deriveNameFromEmail(coordEmail.trim(), 'Class Coordinator');
          await setDoc(doc(db, 'users', uid), {
            uid,
            name: cName,
            email: coordEmail.trim(),
            institution: cInst,
            branch: cBranch,
            term: cTerm,
            classCode: cCode,
            role: 'coordinator',
            createdAt: serverTimestamp()
          }, { merge: true });
        }

        showToast('success', `Welcome back, ${cName}! Coordinator signed in successfully.`);
        completeOnboarding('coordinator', {
          uid,
          email: coordEmail.trim(),
          fullName: cName,
          institution: cInst,
          branch: cBranch,
          semester: cTerm,
          classCode: cCode
        });

        setIsReviewModalOpen(false);
        setTimeout(() => navigate('/dashboard'), 800);
      } catch (err: any) {
        console.error('Coordinator sign-in error:', err);
        setActiveTab('coordinator');
        setIsCoordSignIn(true);
        setCoordPassword('');
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          showToast('error', 'Wrong Password. Please verify your credentials and try again.', 'Sign In Failed');
        } else if (err.code === 'auth/user-not-found') {
          showToast('error', 'No coordinator account found with this email. Please switch to Sign Up mode to register.', 'Account Not Found');
        } else {
          showToast('error', err.message || 'Failed to sign in. Please check your credentials.', 'Sign In Error');
        }
      } finally {
        setIsCoordSubmitting(false);
      }
    } else {
      // ── SIGN UP MODE ──
      if (!coordinatorName.trim()) {
        showToast('error', 'Please enter Coordinator Full Name.');
        setIsCoordSubmitting(false);
        return;
      }

      const newCode = "CS-" + Math.floor(1000 + Math.random() * 9000);
      setGeneratedClassCode(newCode);

      try {
        const userCred = await createUserWithEmailAndPassword(auth, coordEmail.trim(), coordPassword.trim());
        const uid = userCred.user.uid;

        // Write user doc users/{uid}
        await setDoc(doc(db, 'users', uid), {
          uid,
          name: coordinatorName.trim(),
          email: coordEmail.trim(),
          institution: institution.trim() || 'Apex Inst. of Tech',
          branch: branch.trim() || 'Computer Science & Eng',
          semester: semester.trim() || 'Semester V',
          term: semester.trim() || 'Semester V',
          role: 'coordinator',
          classCode: newCode,
          createdAt: serverTimestamp()
        }, { merge: true });

        // Write batch doc batches/{classCode} with EXACT Gemini parsed JSON
        await setDoc(doc(db, 'batches', newCode), {
          classCode: newCode,
          coordinatorUid: uid,
          coordinatorName: coordinatorName.trim(),
          institution: institution.trim() || 'Apex Inst. of Tech',
          branch: branch.trim() || 'Computer Science & Eng',
          semester: semester.trim() || 'Semester V',
          term: semester.trim() || 'Semester V',
          subjects: parsedSubjects || [],
          timetable: parsedTimetable || [],
          createdAt: serverTimestamp()
        }, { merge: true });

        showToast('success', `Coordinator batch initialized! Class Code: ${newCode}`, 'Setup Complete');
        completeOnboarding('coordinator', {
          uid,
          email: coordEmail.trim(),
          fullName: coordinatorName.trim(),
          institution: institution.trim() || 'Apex Inst. of Tech',
          branch: branch.trim() || 'Computer Science & Eng',
          semester: semester.trim() || 'Semester V',
          classCode: newCode
        });

        setIsReviewModalOpen(false);
        setTimeout(() => navigate('/dashboard'), 800);
      } catch (err: any) {
        console.error('Coordinator sign-up error:', err);
        if (err.code === 'auth/email-already-in-use') {
          showToast('info', 'An account already exists for this email. Switched to Sign In mode.', 'Account Exists');
          setIsCoordSignIn(true);
        } else {
          showToast('error', err.message || 'Failed to initialize coordinator batch.', 'Setup Error');
        }
      } finally {
        setIsCoordSubmitting(false);
      }
    }
  };

  const isCoordSignUpValid = coordEmail.trim() !== '' && coordPassword.trim() !== '' && coordinatorName.trim() !== '';
  const isCoordSignInValid = coordEmail.trim() !== '' && coordPassword.trim() !== '';

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teacherEmail.trim()) {
      showToast('error', 'Please enter your Email Address.');
      return;
    }
    if (!teacherPassword.trim()) {
      showToast('error', 'Please enter your Password.');
      return;
    }
    if (!teacherDepartment.trim()) {
      showToast('error', 'Please enter your Department Name (e.g. BCA, CSE).');
      return;
    }

    setIsTeacherLoading(true);
    const upperDept = teacherDepartment.trim().toUpperCase();

    if (isTeacherSignIn) {
      // ── SIGN IN MODE ──
      try {
        const userCred = await signInWithEmailAndPassword(auth, teacherEmail.trim(), teacherPassword.trim());
        const uid = userCred.user.uid;

        const userSnap = await getDoc(doc(db, 'users', uid));

        // IF USER DOC DOES NOT EXIST OR STATUS IS REJECTED (PURGED BY COORDINATOR)
        if (!userSnap.exists() || userSnap.data()?.status === 'REJECTED') {
          await auth.signOut();
          resetOnboarding();
          setActiveTab('teacher');
          setIsTeacherSignIn(false); // AUTOMATICALLY REDIRECT TO TEACHER SIGN-UP VIEW
          setTeacherPassword('');
          showToast('error', 'No active account found for these credentials. Please sign up.', 'Account Not Found');
          setIsTeacherLoading(false);
          return;
        }

        const data = userSnap.data();
        const registeredRole = data.role;
        const status = data.status || 'APPROVED';

        // STRICT ROLE GUARD FOR TEACHER PORTAL
        if (registeredRole === 'student') {
          await auth.signOut();
          resetOnboarding();
          setActiveTab('teacher');
          setIsTeacherSignIn(true);
          setTeacherPassword('');
          showToast('error', 'Access Denied: Student accounts are restricted from the Faculty Portal.', 'Access Denied');
          setIsTeacherLoading(false);
          return;
        }

        if (registeredRole === 'teacher' && status === 'PENDING_APPROVAL') {
          await auth.signOut();
          resetOnboarding();
          setActiveTab('teacher');
          setIsTeacherSignIn(true);
          setTeacherPassword('');
          setPendingApprovalNotice("Account Pending Approval. Please contact your Class Coordinator to activate.");
          showToast('error', 'Account Pending Approval. Please contact your Class Coordinator to activate.', 'Access Blocked');
          setIsTeacherLoading(false);
          return;
        }

        if (registeredRole !== 'teacher' && registeredRole !== 'coordinator') {
          await auth.signOut();
          resetOnboarding();
          setActiveTab('teacher');
          setIsTeacherSignIn(true);
          setTeacherPassword('');
          showToast('error', 'Access Denied: Student accounts are restricted from the Faculty Portal.', 'Access Denied');
          setIsTeacherLoading(false);
          return;
        }

        let tName = data.name || data.fullName || '';
        let tDept = upperDept;
        let tRole = 'teacher';
        if (data.role === 'coordinator') {
          tRole = 'coordinator';
        }

        if (!tName) {
          tName = userCred.user.displayName?.trim() || deriveNameFromEmail(teacherEmail.trim(), 'Faculty Member');
        }

        setPendingApprovalNotice(null);

        // Persist/update user department in Firestore
        await setDoc(doc(db, 'users', uid), {
          uid,
          name: tName,
          email: teacherEmail.trim(),
          department: upperDept,
          role: tRole,
          createdAt: serverTimestamp()
        }, { merge: true });

        showToast('success', `Welcome back, ${tName}! Teacher portal authenticated (${upperDept}).`);
        completeOnboarding(tRole as any, {
          uid,
          email: teacherEmail.trim(),
          fullName: tName,
          department: tDept,
          classCode: 'CS-4051'
        });

        setTimeout(() => navigate('/dashboard'), 800);
      } catch (err: any) {
        console.error('Teacher sign-in error:', err);
        setActiveTab('teacher');
        setIsTeacherSignIn(true);
        setTeacherPassword('');
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          showToast('error', 'Wrong Password. Please verify your credentials and try again.');
        } else if (err.code === 'auth/user-not-found') {
          showToast('error', 'No teacher account found. Switch to Sign Up mode to register.', 'Account Not Found');
        } else {
          showToast('error', err.message || 'Failed to sign in.');
        }
      } finally {
        setIsTeacherLoading(false);
      }
    } else {
      // ── SIGN UP MODE ──
      if (!teacherName.trim()) {
        showToast('error', 'Please enter Teacher Full Name.');
        setIsTeacherLoading(false);
        return;
      }
      if (!teacherDepartment.trim()) {
        showToast('error', 'Please enter Department Name (e.g. BCA, CSE).');
        setIsTeacherLoading(false);
        return;
      }

      try {
        const userCred = await createUserWithEmailAndPassword(auth, teacherEmail.trim(), teacherPassword.trim());
        const uid = userCred.user.uid;

        // Store user profile with role: 'teacher' and status: 'PENDING_APPROVAL'
        await setDoc(doc(db, 'users', uid), {
          uid,
          name: teacherName.trim(),
          email: teacherEmail.trim(),
          department: upperDept,
          role: 'teacher',
          status: 'PENDING_APPROVAL',
          createdAt: serverTimestamp()
        }, { merge: true });

        // Sign out immediately to block dashboard access until coordinator approval
        await auth.signOut();
        setPendingApprovalNotice("Account Pending Approval. Please contact your Class Coordinator to activate your account.");
        showToast('info', 'Faculty registered! Account Pending Approval. Please contact your Class Coordinator to activate your account.', 'Registration Submitted');
        setIsTeacherSignIn(true);
      } catch (err: any) {
        console.error('Teacher sign-up error:', err);
        if (err.code === 'auth/email-already-in-use') {
          try {
            // Re-authenticate existing Firebase Auth user whose Firestore record was purged
            const userCred = await signInWithEmailAndPassword(auth, teacherEmail.trim(), teacherPassword.trim());
            const uid = userCred.user.uid;
            await setDoc(doc(db, 'users', uid), {
              uid,
              name: teacherName.trim(),
              email: teacherEmail.trim(),
              department: upperDept,
              role: 'teacher',
              status: 'PENDING_APPROVAL',
              createdAt: serverTimestamp()
            }, { merge: true });

            await auth.signOut();
            setPendingApprovalNotice("Account Pending Approval. Please contact your Class Coordinator to activate your account.");
            showToast('info', 'Faculty re-registration submitted! Account Pending Approval.', 'Registration Submitted');
            setIsTeacherSignIn(true);
          } catch (signInErr: any) {
            showToast('info', 'An account already exists for this email. Switched to Sign In mode.');
            setIsTeacherSignIn(true);
          }
        } else {
          showToast('error', err.message || 'Failed to register teacher account.');
        }
      } finally {
        setIsTeacherLoading(false);
      }
    }
  };

  return (
    <div className="space-y-8 py-6 max-w-4xl mx-auto">
      {/* Toast alert component */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Hidden file input for AI Timetable OCR */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,.pdf"
        className="hidden"
      />

      {/* System Status Tag */}
      <div className="flex justify-center">
        <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200/80 px-4 py-1.5 rounded-full text-xs font-mono text-emerald-700 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="tnum uppercase font-semibold">
            {mode === 'faculty' ? 'Academic-Sync • Faculty & Coordinator Portal' : 'Academic-Sync • Student Gate'}
          </span>
        </div>
      </div>

      {/* Hero Headline & Subtext */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-jakarta font-bold tracking-tight text-neutral-900">
          {mode === 'faculty' ? (
            <>
              Faculty & Coordinator <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-[#FF6B4B] bg-clip-text text-transparent">Administration Portal</span>
            </>
          ) : (
            <>
              Smart Attendance Tracking & <span className="bg-gradient-to-r from-[#FF6B4B] via-[#F59E0B] to-[#10B981] bg-clip-text text-transparent">Predictive Forecasting</span>
            </>
          )}
        </h1>
        <p className="text-sm text-neutral-600 leading-relaxed font-sans max-w-xl mx-auto">
          {mode === 'faculty'
            ? 'Manage batch schedules, verify student GPS geofencing, and review faculty registration approvals.'
            : 'Track your class attendance, calculate minimum attendance targets, and get intelligent forecasts to stay above your institution requirement.'}
        </p>
      </div>

      {/* Centered Sleek Tab Switcher Pill — ONLY rendered for Faculty Portal mode */}
      {mode === 'faculty' && (
        <div className="flex justify-center">
          <div className="bg-white border border-amber-200/70 p-1.5 rounded-full inline-flex items-center space-x-2 shadow-sm flex-wrap justify-center">
            <button
              type="button"
              onClick={() => setActiveTab('teacher')}
              className={`px-5 py-2 rounded-full text-xs font-mono uppercase tracking-wider font-bold transition-all flex items-center space-x-2 ${activeTab === 'teacher'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-amber-50/50'
                }`}
            >
              <Award className="w-4 h-4" />
              <span>Teacher Hub</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('coordinator')}
              className={`px-5 py-2 rounded-full text-xs font-mono uppercase tracking-wider font-bold transition-all flex items-center space-x-2 ${activeTab === 'coordinator'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-amber-50/50'
                }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Coordinator Hub</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Centered Gate Card Container */}
      <div className="max-w-2xl mx-auto">
        {activeTab === 'student' ? (
          /* Student Gate Card */
          <div className="stealth-card p-8 sm:p-10 md:p-12 flex flex-col justify-between animate-fade-in border border-amber-100 shadow-xl shadow-amber-900/5">
            <form onSubmit={handleStudentSubmit} className="space-y-6">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2 text-emerald-600">
                  <UserCheck className="w-5 h-5" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                    {isStudentSignIn ? 'Student Sign In' : 'Join as Student'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-neutral-400 uppercase font-semibold">
                  {isStudentSignIn ? 'Sign In Mode' : 'New Registration'}
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-jakarta font-bold text-neutral-900">
                  {isStudentSignIn ? 'Student Sign In' : 'Class Member Gate'}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed mt-1.5">
                  {isStudentSignIn
                    ? 'Welcome back! Enter your email address and password to access your student attendance dashboard.'
                    : 'Enter your credentials, personal details, and 6-digit class code to join your cohort and start tracking attendance.'}
                </p>
              </div>

              {/* 2-Column Grid for Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {/* Email Address */}
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-mono text-neutral-700 uppercase block font-semibold tracking-wider mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none z-10">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      placeholder="student@institution.edu"
                      className="input-stealth w-full pl-11 pr-4 py-3.5 font-sans text-sm placeholder:text-neutral-400 text-neutral-900"
                    />
                  </div>
                </div>

                {/* Password with Eye Toggle */}
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-mono text-neutral-700 uppercase block font-semibold tracking-wider mb-1.5">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none z-10">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showStudentPassword ? 'text' : 'password'}
                      required
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-stealth w-full pl-11 pr-11 py-3.5 font-mono text-sm placeholder:text-neutral-400 text-neutral-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStudentPassword(prev => !prev)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors z-10 p-1 rounded-md focus:outline-none"
                      title={showStudentPassword ? "Hide password" : "Show password"}
                    >
                      {showStudentPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* SIGN-UP MODE ADDITIONAL FIELDS */}
                {!isStudentSignIn && (
                  <>
                    {/* Full Name */}
                    <div className="space-y-1.5 sm:col-span-1">
                      <label className="text-xs font-mono text-neutral-700 uppercase block font-semibold tracking-wider mb-1.5">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none z-10">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="input-stealth w-full pl-11 pr-4 py-3.5 font-sans text-sm placeholder:text-neutral-400 text-neutral-900"
                        />
                      </div>
                    </div>

                    {/* Roll Number / Student ID */}
                    <div className="space-y-1.5 sm:col-span-1">
                      <label className="text-xs font-mono text-neutral-700 uppercase block font-semibold tracking-wider mb-1.5">
                        Roll Number / ID <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none z-10">
                          <Hash className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          value={rollNumber}
                          onChange={(e) => setRollNumber(e.target.value)}
                          placeholder="e.g. 21CS045"
                          className="input-stealth w-full pl-11 pr-4 py-3.5 font-mono text-sm placeholder:text-neutral-400 text-neutral-900"
                        />
                      </div>
                    </div>

                    {/* 6-Digit Class Code */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <div className="flex items-center justify-between text-xs text-neutral-600 mb-1.5">
                        <label className="text-xs font-mono text-neutral-700 uppercase block font-semibold tracking-wider">
                          6-Digit Class Code <span className="text-rose-500">*</span>
                        </label>
                      </div>

                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none z-10">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          value={tokenInput}
                          onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                          placeholder="e.g. CS-4051"
                          className="input-stealth w-full pl-11 pr-16 py-3.5 font-mono text-sm tracking-wider uppercase font-bold placeholder:text-neutral-400 text-neutral-900"
                        />
                        {tokenInput && (
                          <button
                            type="button"
                            onClick={() => setTokenInput('')}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700 font-mono z-10"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Primary Action Button */}
              <div className="mt-6 space-y-3.5">
                <button
                  type="submit"
                  disabled={isStudentLoading}
                  className="btn-primary w-full py-4 flex items-center justify-center space-x-2 text-xs uppercase tracking-wider font-bold shadow-md disabled:opacity-70"
                >
                  {isStudentLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isStudentSignIn ? (
                    <LogIn className="w-4 h-4" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>
                    {isStudentLoading
                      ? isStudentSignIn ? 'SIGNING IN...' : 'AUTHENTICATING & JOINING...'
                      : isStudentSignIn ? 'SIGN IN TO DASHBOARD' : 'JOIN CLASS BATCH'}
                  </span>
                </button>
              </div>
            </form>

            {/* Dynamic Sign-In / Sign-Up Mode Toggle Link */}
            <div className="pt-5 mt-6 border-t border-amber-100/80 text-xs text-neutral-600 font-sans text-center">
              {isStudentSignIn ? (
                <span>
                  Need to register a new account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsStudentSignIn(false)}
                    className="text-[#FF6B4B] hover:underline font-bold transition-colors ml-1"
                  >
                    Sign Up
                  </button>
                </span>
              ) : (
                <span>
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => setIsStudentSignIn(true)}
                    className="text-[#FF6B4B] hover:underline font-bold transition-colors ml-1"
                  >
                    Sign In
                  </button>
                </span>
              )}
            </div>
          </div>
        ) : activeTab === 'coordinator' ? (
          /* Class Coordinator Setup Card */
          <div className="stealth-card p-8 sm:p-10 md:p-12 flex flex-col justify-between animate-fade-in border border-amber-100 shadow-xl shadow-amber-900/5">
            <form onSubmit={handleCoordSubmit} className="space-y-6">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2 text-indigo-600">
                  <BookOpen className="w-5 h-5" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                    {isCoordSignIn ? 'Coordinator Sign In' : 'Class Coordinator Setup'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-neutral-400 uppercase font-semibold">
                  {isCoordSignIn ? 'Sign In Mode' : 'New Setup'}
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-jakarta font-bold text-neutral-900">
                  {isCoordSignIn ? 'Coordinator Sign In' : 'Class Coordinator Hub'}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed mt-1.5">
                  {isCoordSignIn
                    ? 'Welcome back! Enter your email address and password to manage your cohort and view student roster.'
                    : 'Establish your cohort routine. Enter account details, institution info, and parse your timetable with Gemini AI.'}
                </p>
              </div>

              {/* 2-Column Grid Container */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {/* Coordinator Email Address */}
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-mono text-neutral-700 uppercase block font-semibold tracking-wider mb-1.5">
                    Coordinator Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none z-10">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={coordEmail}
                      onChange={(e) => setCoordEmail(e.target.value)}
                      placeholder="coordinator@institution.edu"
                      className="input-stealth w-full pl-11 pr-4 py-3.5 font-sans text-sm placeholder:text-neutral-400 text-neutral-900"
                    />
                  </div>
                </div>

                {/* Coordinator Password with Eye Toggle */}
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-mono text-neutral-700 uppercase block font-semibold tracking-wider mb-1.5">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none z-10">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showCoordPassword ? 'text' : 'password'}
                      required
                      value={coordPassword}
                      onChange={(e) => setCoordPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-stealth w-full pl-11 pr-11 py-3.5 font-mono text-sm placeholder:text-neutral-400 text-neutral-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCoordPassword(prev => !prev)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors z-10 p-1 rounded-md focus:outline-none"
                      title={showCoordPassword ? "Hide password" : "Show password"}
                    >
                      {showCoordPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* SIGN-UP MODE ADDITIONAL FIELDS FOR COORDINATOR */}
                {!isCoordSignIn && (
                  <>
                    {/* Coordinator Full Name Field */}
                    <div className="space-y-1.5 sm:col-span-1">
                      <label className="text-xs font-mono text-neutral-700 uppercase block font-semibold tracking-wider mb-1.5">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none z-10">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          value={coordinatorName}
                          onChange={(e) => setCoordinatorName(e.target.value)}
                          placeholder="e.g. Prof. S. Chakrabarti"
                          className="input-stealth w-full pl-11 pr-4 py-3.5 font-sans text-sm placeholder:text-neutral-400 text-neutral-900"
                        />
                      </div>
                    </div>

                    {/* Institution */}
                    <div className="space-y-1.5 sm:col-span-1">
                      <label className="text-xs font-mono text-neutral-700 uppercase block font-semibold tracking-wider mb-1.5">
                        Institution
                      </label>
                      <input
                        type="text"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="e.g. Apex Inst. of Tech"
                        className="input-stealth w-full px-4 py-3.5 font-mono text-xs placeholder:text-neutral-400 text-neutral-900"
                      />
                    </div>

                    {/* Branch / Dept */}
                    <div className="space-y-1.5 sm:col-span-1">
                      <label className="text-xs font-mono text-neutral-700 uppercase block font-semibold tracking-wider mb-1.5">
                        Branch / Dept
                      </label>
                      <input
                        type="text"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        placeholder="e.g. Comp. Sci. & Eng"
                        className="input-stealth w-full px-4 py-3.5 font-mono text-xs placeholder:text-neutral-400 text-neutral-900"
                      />
                    </div>

                    {/* Term / Semester */}
                    <div className="space-y-1.5 sm:col-span-1">
                      <label className="text-xs font-mono text-neutral-700 uppercase block font-semibold tracking-wider mb-1.5">
                        Term / Semester
                      </label>
                      <input
                        type="text"
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        placeholder="e.g. Semester V"
                        className="input-stealth w-full px-4 py-3.5 font-mono text-xs placeholder:text-neutral-400 text-neutral-900"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Timetable Upload & Action Buttons Section */}
              {!isCoordSignIn && (
                <>
                  {/* Drag and Drop Zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-amber-300/80 hover:border-[#FF6B4B] bg-amber-50/40 rounded-2xl py-6 px-4 text-center cursor-pointer transition-colors space-y-2 group my-3"
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-center space-x-2 text-emerald-700 font-semibold text-xs py-1">
                        <FileImage className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="truncate">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 mx-auto text-[#FF6B4B] transition-transform group-hover:scale-110" />
                        <p className="text-xs text-neutral-800 font-semibold">Click to upload schedule routine image or PDF document</p>
                        <p className="text-[10px] text-neutral-500 font-mono">Supports JPG, PNG, PDF with Gemini 2.5 Flash OCR</p>
                      </>
                    )}
                  </div>

                  {/* Secondary Action Outline Button: AI Auto-Parse */}
                  <button
                    type="button"
                    onClick={handleAutoParseTimetable}
                    disabled={isParsing}
                    className="btn-stealth w-full py-3.5 flex items-center justify-center space-x-2 text-xs font-mono uppercase font-bold shadow-xs border border-amber-300/80 bg-amber-50/60 hover:bg-amber-100/70 text-amber-900 transition-all"
                  >
                    {isParsing ? (
                      <Loader2 className="w-4 h-4 text-[#FF6B4B] animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-[#FF6B4B]" />
                    )}
                    <span>{isParsing ? 'AI Scanning Timetable Document...' : selectedFile ? 'AUTO-PARSE TIMETABLE WITH AI' : 'SELECT & AUTO-PARSE TIMETABLE WITH AI'}</span>
                  </button>
                </>
              )}

              {/* Primary Action Button */}
              <div className="mt-6 space-y-3.5">
                <button
                  type="submit"
                  disabled={isCoordSubmitting || (isCoordSignIn ? !isCoordSignInValid : !isCoordSignUpValid)}
                  className="btn-primary w-full py-4 flex items-center justify-center space-x-2 text-xs uppercase tracking-wider font-bold shadow-md shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isCoordSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCoordSignIn ? (
                    <LogIn className="w-4 h-4" />
                  ) : (
                    <BookOpen className="w-4 h-4" />
                  )}
                  <span>
                    {isCoordSubmitting
                      ? isCoordSignIn ? 'SIGNING IN...' : 'CREATING BATCH & PERSISTING FIRESTORE...'
                      : isCoordSignIn ? 'SIGN IN TO DASHBOARD' : 'INITIALIZE COORDINATOR BATCH'}
                  </span>
                </button>
              </div>
            </form>

            {/* Dynamic Sign-In / Sign-Up Mode Toggle Link */}
            <div className="pt-5 mt-6 border-t border-amber-100/80 text-xs text-neutral-600 font-sans text-center">
              {isCoordSignIn ? (
                <span>
                  Need to create a new batch?{' '}
                  <button
                    type="button"
                    onClick={() => setIsCoordSignIn(false)}
                    className="text-[#FF6B4B] hover:underline font-bold transition-colors ml-1"
                  >
                    Register as Coordinator (Sign Up)
                  </button>
                </span>
              ) : (
                <span>
                  Already registered as Coordinator?{' '}
                  <button
                    type="button"
                    onClick={() => setIsCoordSignIn(true)}
                    className="text-[#FF6B4B] hover:underline font-bold transition-colors ml-1"
                  >
                    Sign In
                  </button>
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Teacher Hub Card */
          <div className="stealth-card p-8 sm:p-10 md:p-12 flex flex-col justify-between animate-fade-in border border-amber-100 shadow-xl shadow-amber-900/5">
            <form onSubmit={handleTeacherSubmit} className="space-y-6">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2 text-purple-600">
                  <Award className="w-5 h-5" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                    {isTeacherSignIn ? 'Teacher Sign In' : 'Register Faculty Member'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-neutral-400 uppercase font-semibold">
                  {isTeacherSignIn ? 'Sign In Mode' : 'Faculty Sign Up'}
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-jakarta font-bold text-neutral-900">
                  {isTeacherSignIn ? 'Teacher Portal Sign In' : 'Teacher Hub Setup'}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed mt-1.5">
                  {isTeacherSignIn
                    ? 'Enter your credentials to access your department batches and trigger active class sessions.'
                    : 'Register as a Faculty Member under your department (e.g. BCA, CSE) to manage batch sessions.'}
                </p>
              </div>

              {pendingApprovalNotice && (
                <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-start space-x-3 animate-fade-in shadow-xs">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs font-mono text-amber-950 space-y-1">
                    <strong className="block font-bold font-jakarta text-sm">Account Pending Approval</strong>
                    <p className="leading-relaxed font-sans text-neutral-700">
                      Account Pending Approval. Please contact your Class Coordinator to activate your account.
                    </p>
                  </div>
                </div>
              )}

              {/* Input Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {/* Email Address */}
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-mono text-neutral-700 uppercase block font-semibold tracking-wider mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none z-10">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={teacherEmail}
                      onChange={(e) => setTeacherEmail(e.target.value)}
                      placeholder="teacher@institution.edu"
                      className="input-stealth w-full pl-11 pr-4 py-3.5 font-sans text-sm placeholder:text-neutral-400 text-neutral-900"
                    />
                  </div>
                </div>

                {/* Password with Eye Toggle */}
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-mono text-neutral-700 uppercase block font-semibold tracking-wider mb-1.5">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none z-10">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showTeacherPassword ? 'text' : 'password'}
                      required
                      value={teacherPassword}
                      onChange={(e) => setTeacherPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-stealth w-full pl-11 pr-11 py-3.5 font-mono text-sm placeholder:text-neutral-400 text-neutral-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTeacherPassword(prev => !prev)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors z-10 p-1 rounded-md focus:outline-none"
                    >
                      {showTeacherPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Department Name (AUTO UPPERCASE) */}
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-mono text-neutral-700 uppercase block font-semibold tracking-wider mb-1.5">
                    Department Name (UPPERCASE) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none z-10">
                      <Building className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={teacherDepartment}
                      onChange={(e) => setTeacherDepartment(e.target.value.toUpperCase())}
                      placeholder="e.g. BCA, CSE, CS"
                      className="input-stealth w-full pl-11 pr-4 py-3.5 font-mono text-sm uppercase tracking-wider font-bold placeholder:text-neutral-400 text-neutral-900"
                    />
                  </div>
                </div>

                {/* SIGN-UP MODE ADDITIONAL FIELDS */}
                {!isTeacherSignIn && (
                  /* Full Name */
                  <div className="space-y-1.5 sm:col-span-1">
                    <label className="text-xs font-mono text-neutral-700 uppercase block font-semibold tracking-wider mb-1.5">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none z-10">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={teacherName}
                        onChange={(e) => setTeacherName(e.target.value)}
                        placeholder="e.g. Dr. A. K. Verma"
                        className="input-stealth w-full pl-11 pr-4 py-3.5 font-sans text-sm placeholder:text-neutral-400 text-neutral-900"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Primary Action Button */}
              <div className="mt-6 space-y-3.5">
                <button
                  type="submit"
                  disabled={isTeacherLoading || !teacherEmail.trim() || !teacherPassword.trim() || !teacherDepartment.trim() || (!isTeacherSignIn && !teacherName.trim())}
                  className="btn-primary w-full py-4 flex items-center justify-center space-x-2 text-xs uppercase tracking-wider font-bold shadow-md shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTeacherLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isTeacherSignIn ? (
                    <LogIn className="w-4 h-4" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>
                    {isTeacherLoading
                      ? isTeacherSignIn ? 'SIGNING IN...' : 'REGISTERING FACULTY ACCOUNT...'
                      : isTeacherSignIn ? 'SIGN IN TO TEACHER DASHBOARD' : 'REGISTER TEACHER ACCOUNT'}
                  </span>
                </button>
              </div>
            </form>

            {/* Mode Toggle Link */}
            <div className="pt-5 mt-6 border-t border-amber-100/80 text-xs text-neutral-600 font-sans text-center">
              {isTeacherSignIn ? (
                <span>
                  New Teacher?{' '}
                  <button
                    type="button"
                    onClick={() => setIsTeacherSignIn(false)}
                    className="text-purple-600 hover:underline font-bold transition-colors ml-1"
                  >
                    Register as Faculty Member (Sign Up)
                  </button>
                </span>
              ) : (
                <span>
                  Already registered as Teacher/Coordinator?{' '}
                  <button
                    type="button"
                    onClick={() => setIsTeacherSignIn(true)}
                    className="text-purple-600 hover:underline font-bold transition-colors ml-1"
                  >
                    Sign In
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────── */}
      {/* EDITABLE REVIEW GRID MODAL FOR PARSED TIMETABLE */}
      {/* ────────────────────────────────────────── */}
      {isReviewModalOpen && parsedTimetable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-amber-950/30 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white border border-amber-200 rounded-3xl p-6 shadow-2xl max-w-3xl w-full my-8 space-y-5 text-neutral-800">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-[#FF6B4B]" />
                <div>
                  <h3 className="font-jakarta font-bold text-neutral-900 text-lg">Review & Verify AI-Parsed Timetable</h3>
                  <p className="text-xs text-neutral-500 font-mono">Gemini 2.5 Flash API extracted weekly schedule routine</p>
                </div>
              </div>
              <span className="bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px] uppercase px-3 py-1 rounded-full">
                AI Verified
              </span>
            </div>

            {/* Extracted Subjects Summary */}
            {parsedSubjects && parsedSubjects.length > 0 && (
              <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-4 space-y-2">
                <h4 className="font-jakarta font-bold text-neutral-900 text-xs uppercase tracking-wider text-amber-900">Extracted Subjects Roster</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {parsedSubjects.map((sub, sIdx) => (
                    <div key={sIdx} className="bg-white border border-amber-200/80 px-3 py-2 rounded-xl text-xs space-y-0.5">
                      <span className="font-mono font-bold text-[#FF6B4B] text-[11px] block">{sub.code}</span>
                      <p className="font-semibold text-neutral-800 text-xs truncate">{sub.name}</p>
                      <p className="text-[10px] text-neutral-500 font-mono truncate">{sub.faculty}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timetable Slots Grid */}
            <div className="max-h-96 overflow-y-auto space-y-4 pr-1">
              {parsedTimetable.map((daySched, dIdx) => (
                <div key={dIdx} className="bg-amber-50/50 border border-amber-100/80 rounded-2xl p-4 space-y-3">
                  <h4 className="font-jakarta font-bold text-neutral-900 text-sm flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-[#FF6B4B]" />
                    <span>{daySched.day}</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {daySched.slots?.map((slot, sIdx) => (
                      <div key={sIdx} className="bg-white border border-amber-200/80 p-3 rounded-xl text-xs space-y-1.5 shadow-xs">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="font-bold text-[#FF6B4B]">{slot.code || 'LEC'}</span>
                          <span className="text-neutral-500">{slot.time}</span>
                        </div>
                        <input
                          type="text"
                          value={slot.subject}
                          onChange={(e) => {
                            const updated = [...parsedTimetable];
                            updated[dIdx].slots[sIdx].subject = e.target.value;
                            setParsedTimetable(updated);
                          }}
                          className="font-jakarta font-bold text-neutral-900 text-xs w-full bg-stone-50 border border-stone-200 rounded-md px-2 py-1"
                        />
                        <div className="flex items-center space-x-2 text-[10px]">
                          <input
                            type="text"
                            value={slot.faculty}
                            placeholder="Faculty"
                            onChange={(e) => {
                              const updated = [...parsedTimetable];
                              updated[dIdx].slots[sIdx].faculty = e.target.value;
                              setParsedTimetable(updated);
                            }}
                            className="w-1/2 bg-stone-50 border border-stone-200 rounded px-1.5 py-0.5 font-mono"
                          />
                          <input
                            type="text"
                            value={slot.room || ''}
                            placeholder="Room"
                            onChange={(e) => {
                              const updated = [...parsedTimetable];
                              updated[dIdx].slots[sIdx].room = e.target.value;
                              setParsedTimetable(updated);
                            }}
                            className="w-1/2 bg-stone-50 border border-stone-200 rounded px-1.5 py-0.5 font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-amber-100">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 bg-stone-100 hover:bg-stone-200 rounded-full transition-colors"
              >
                Close & Edit Later
              </button>
              <button
                type="button"
                onClick={(e) => handleCoordSubmit(e)}
                disabled={isCoordSubmitting}
                className="btn-primary px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white rounded-full bg-[#FF6B4B] hover:bg-[#e05638] shadow-md flex items-center space-x-2"
              >
                {isCoordSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>CONFIRM TIMETABLE & GENERATE CLASS CODE</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
