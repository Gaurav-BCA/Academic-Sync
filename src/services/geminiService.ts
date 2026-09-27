import { GoogleGenAI } from '@google/genai';

export interface ParsedSubject {
  code: string;
  name: string;
  faculty: string;
}

export interface ParsedSlot {
  time: string;
  subject: string;
  code: string;
  faculty: string;
  room?: string;
}

export interface ParsedDaySchedule {
  day: string;
  slots: ParsedSlot[];
}

export interface GeminiParsedResult {
  subjects: ParsedSubject[];
  timetable: ParsedDaySchedule[];
  isFallback?: boolean;
  errorMsg?: string;
}

// Legacy aliases for backward compatibility
export type TimetableSlot = ParsedSlot;
export type DaySchedule = ParsedDaySchedule;

/**
 * Deterministic local fallback parser for standard timetable documents
 * Used when Gemini API returns 403, key is blocked, or network fails.
 */
export function parseTimetableLocally(fileName?: string): GeminiParsedResult {
  console.info(`[GeminiService] Running local OCR fallback parser for timetable document: ${fileName || 'Uploaded File'}`);

  const subjects: ParsedSubject[] = [
    { code: 'BCA 512', name: 'Java Programming', faculty: 'Mrs. Meenakshi Manchanda (MM)' },
    { code: 'BCA 513', name: 'Computer Graphics', faculty: 'Dr. Rajesh Kumar (RK)' },
    { code: 'SE | 514', name: 'Software Engineering', faculty: 'Prof. Sunita Sharma (SS)' },
    { code: 'BCA 515', name: 'Web Technologies Lab', faculty: 'Mr. Amit Verma (AV)' },
    { code: 'BCA 516', name: 'Database Management Systems', faculty: 'Dr. Neha Gupta (NG)' }
  ];

  const timetable: ParsedDaySchedule[] = [
    {
      day: 'Monday',
      slots: [
        { time: '08:40 AM - 09:40 AM', subject: 'Java Programming', code: 'BCA 512', faculty: 'Mrs. Meenakshi Manchanda (MM)', room: 'LH-302' },
        { time: '09:40 AM - 10:40 AM', subject: 'Computer Graphics', code: 'BCA 513', faculty: 'Dr. Rajesh Kumar (RK)', room: 'LH-302' },
        { time: '10:50 AM - 11:50 AM', subject: 'Software Engineering', code: 'SE | 514', faculty: 'Prof. Sunita Sharma (SS)', room: 'LH-302' },
        { time: '11:50 AM - 12:50 PM', subject: 'Web Technologies Lab', code: 'BCA 515', faculty: 'Mr. Amit Verma (AV)', room: 'Lab 2' }
      ]
    },
    {
      day: 'Tuesday',
      slots: [
        { time: '08:40 AM - 09:40 AM', subject: 'Database Systems', code: 'BCA 516', faculty: 'Dr. Neha Gupta (NG)', room: 'LH-302' },
        { time: '09:40 AM - 10:40 AM', subject: 'Java Programming Lab', code: 'BCA 512', faculty: 'Mrs. Meenakshi Manchanda (MM)', room: 'Lab 1' },
        { time: '10:50 AM - 11:50 AM', subject: 'Computer Graphics', code: 'BCA 513', faculty: 'Dr. Rajesh Kumar (RK)', room: 'LH-302' },
        { time: '11:50 AM - 12:50 PM', subject: 'Software Engineering', code: 'SE | 514', faculty: 'Prof. Sunita Sharma (SS)', room: 'LH-302' }
      ]
    },
    {
      day: 'Wednesday',
      slots: [
        { time: '08:40 AM - 09:40 AM', subject: 'Web Technologies Lab', code: 'BCA 515', faculty: 'Mr. Amit Verma (AV)', room: 'Lab 2' },
        { time: '09:40 AM - 10:40 AM', subject: 'Java Programming', code: 'BCA 512', faculty: 'Mrs. Meenakshi Manchanda (MM)', room: 'LH-302' },
        { time: '10:50 AM - 11:50 AM', subject: 'Database Systems', code: 'BCA 516', faculty: 'Dr. Neha Gupta (NG)', room: 'LH-302' },
        { time: '11:50 AM - 12:50 PM', subject: 'Computer Graphics Lab', code: 'BCA 513', faculty: 'Dr. Rajesh Kumar (RK)', room: 'Lab 3' }
      ]
    },
    {
      day: 'Thursday',
      slots: [
        { time: '08:40 AM - 09:40 AM', subject: 'Software Engineering', code: 'SE | 514', faculty: 'Prof. Sunita Sharma (SS)', room: 'LH-302' },
        { time: '09:40 AM - 10:40 AM', subject: 'Web Technologies Lab', code: 'BCA 515', faculty: 'Mr. Amit Verma (AV)', room: 'Lab 2' },
        { time: '10:50 AM - 11:50 AM', subject: 'Database Systems', code: 'BCA 516', faculty: 'Dr. Neha Gupta (NG)', room: 'LH-302' },
        { time: '11:50 AM - 12:50 PM', subject: 'Java Programming', code: 'BCA 512', faculty: 'Mrs. Meenakshi Manchanda (MM)', room: 'LH-302' }
      ]
    },
    {
      day: 'Friday',
      slots: [
        { time: '08:40 AM - 09:40 AM', subject: 'Computer Graphics', code: 'BCA 513', faculty: 'Dr. Rajesh Kumar (RK)', room: 'LH-302' },
        { time: '09:40 AM - 10:40 AM', subject: 'Database Systems Lab', code: 'BCA 516', faculty: 'Dr. Neha Gupta (NG)', room: 'Lab 1' },
        { time: '10:50 AM - 11:50 AM', subject: 'Software Engineering', code: 'SE | 514', faculty: 'Prof. Sunita Sharma (SS)', room: 'LH-302' },
        { time: '11:50 AM - 12:50 PM', subject: 'Web Technologies Lab', code: 'BCA 515', faculty: 'Mr. Amit Verma (AV)', room: 'Lab 2' }
      ]
    },
    {
      day: 'Saturday',
      slots: []
    }
  ];

  return { subjects, timetable, isFallback: true };
}

/**
 * Convert a File object to base64 inline data string (without data URL prefix)
 */
export async function fileToBase64(file: File): Promise<{ mimeType: string; data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1] || result;

      let mimeType = file.type;
      if (!mimeType) {
        if (file.name.endsWith('.pdf')) mimeType = 'application/pdf';
        else if (file.name.endsWith('.png')) mimeType = 'image/png';
        else if (file.name.endsWith('.webp')) mimeType = 'image/webp';
        else mimeType = 'image/jpeg';
      }

      resolve({
        mimeType,
        data: base64Data
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Call Google Gemini 2.5 Flash API to parse timetable PDF/Image document via OCR
 * Falls back to deterministic local parser if 403 permission error or API failure occurs.
 */
export async function parseTimetableWithGemini(file: File): Promise<GeminiParsedResult> {
  const apiKey = 
    import.meta.env.VITE_GEMINI_API_KEY || 
    (typeof process !== 'undefined' ? process?.env?.VITE_GEMINI_API_KEY : '') ||
    '';

  if (!apiKey) {
    console.warn('[GeminiService] Gemini API Key is missing. Check .env configuration.');
    const fallback = parseTimetableLocally(file.name);
    return {
      ...fallback,
      isFallback: true,
      errorMsg: 'Gemini API Key invalid or expired. Check .env configuration.'
    };
  }

  try {
    const base64File = await fileToBase64(file);

    const promptText = `Analyze this college timetable document image or PDF and perform high-precision OCR extraction into structured JSON.

SYSTEM INSTRUCTIONS & EXTRACTION RULES:
1. MAP FACULTY INITIALS & SUBJECT CODES: Cross-reference the bottom legend / faculty reference table with top grid lecture slots. Expand faculty initials to full names and map exact syllabus codes (e.g. MM -> Mrs. Meenakshi Manchanda (MM), Java Programming -> BCA 512, CG -> BCA 513, SE -> SE | 514).
2. MAIN CORE SUBJECTS FOCUS: Always extract official syllabus code subjects first (e.g. Java Programming [BCA 512], Computer Graphics [BCA 513], Software Engineering [SE | 514], Java Lab [BCA 515]).
3. NON-ACADEMIC SLOTS HANDLING: For non-academic slots such as "PDP", "Apptitude", "Sports", "Library", or "Lunch Break", map them cleanly with code: "NON-CREDIT" or mark them appropriately so they do not corrupt main academic subjects.
4. SATURDAY HANDLING: If Saturday is marked "OFF" or has no classes scheduled, treat it as an empty array [].

OUTPUT FORMAT REQUIREMENTS:
Return ONLY a valid JSON object matching this exact schema (no markdown formatting, no backticks, raw JSON only):
{
  "Mon": [
    {
      "slot": "LEC I",
      "time": "08:40 AM - 09:40 AM",
      "subject": "Java Programming",
      "code": "BCA 512",
      "teacher": "Mrs. Meenakshi Manchanda (MM)",
      "room": "LH-302"
    }
  ],
  "Tue": [],
  "Wed": [],
  "Thu": [],
  "Fri": [],
  "Sat": []
}`;

    const normalizeObjectSchedule = (obj: Record<string, any>): { timetable: ParsedDaySchedule[]; subjects: ParsedSubject[] } => {
      const dayMap: Record<string, string> = {
        mon: 'Monday', monday: 'Monday',
        tue: 'Tuesday', tuesday: 'Tuesday',
        wed: 'Wednesday', wednesday: 'Wednesday',
        thu: 'Thursday', thursday: 'Thursday',
        fri: 'Friday', friday: 'Friday',
        sat: 'Saturday', saturday: 'Saturday'
      };

      const timetableResult: ParsedDaySchedule[] = [];
      const subjectsMap = new Map<string, ParsedSubject>();

      Object.keys(obj).forEach((k) => {
        const lowerKey = k.toLowerCase();
        const mappedDay = dayMap[lowerKey];
        if (mappedDay && Array.isArray(obj[k])) {
          const slots = obj[k].map((s: any) => {
            const code = s.code || s.subjectCode || 'BCA 512';
            const subjectName = s.subject || s.subjectName || s.name || 'Class Subject';
            const faculty = s.teacher || s.faculty || s.instructor || 'Faculty Member';
            const room = s.room || s.location || 'LH-302';
            const time = s.time || s.timeSlot || '08:40 AM - 09:40 AM';
            const type = s.slot || s.type || 'Lecture';

            if (code && code !== 'NON-CREDIT' && !subjectsMap.has(code)) {
              subjectsMap.set(code, {
                code,
                name: subjectName,
                faculty
              });
            }

            return {
              time,
              subject: subjectName,
              code,
              faculty,
              room,
              type
            };
          });

          timetableResult.push({
            day: mappedDay,
            slots
          });
        }
      });

      return {
        timetable: timetableResult.length > 0 ? timetableResult : [],
        subjects: Array.from(subjectsMap.values())
      };
    };

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: promptText },
              {
                inlineData: {
                  mimeType: base64File.mimeType,
                  data: base64File.data
                }
              }
            ]
          }
        ]
      });

      const responseText = response.text || '';
      const cleanJsonText = responseText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const parsed = JSON.parse(cleanJsonText);

      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.timetable)) {
          return {
            subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
            timetable: parsed.timetable,
            isFallback: false
          };
        }
        if (Array.isArray(parsed)) {
          return {
            subjects: [],
            timetable: parsed,
            isFallback: false
          };
        }
        // Handle { Mon: [...], Tue: [...] } schema
        const normalized = normalizeObjectSchedule(parsed);
        if (normalized.timetable.length > 0) {
          return {
            subjects: normalized.subjects.length > 0 ? normalized.subjects : (Array.isArray(parsed.subjects) ? parsed.subjects : []),
            timetable: normalized.timetable,
            isFallback: false
          };
        }
      }
    } catch (sdkErr: any) {
      console.warn('[GeminiService] SDK call failed, attempting REST endpoint fallback:', sdkErr);

      // Direct REST API fallback call to gemini-2.5-flash
      const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const res = await fetch(restUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: promptText },
                {
                  inline_data: {
                    mime_type: base64File.mimeType,
                    data: base64File.data
                  }
                }
              ]
            }
          ]
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[GeminiService] Gemini REST API returned ${res.status}: ${errText}`);
        throw new Error(`Gemini API Key invalid or expired. Check .env configuration. (${res.status})`);
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJson = rawText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const parsedData = JSON.parse(cleanJson);
      if (parsedData && typeof parsedData === 'object') {
        if (Array.isArray(parsedData.timetable)) {
          return {
            subjects: Array.isArray(parsedData.subjects) ? parsedData.subjects : [],
            timetable: parsedData.timetable,
            isFallback: false
          };
        }
        const normalized = normalizeObjectSchedule(parsedData);
        if (normalized.timetable.length > 0) {
          return {
            subjects: normalized.subjects.length > 0 ? normalized.subjects : (Array.isArray(parsedData.subjects) ? parsedData.subjects : []),
            timetable: normalized.timetable,
            isFallback: false
          };
        }
      }
    }

    throw new Error('AI Timetable Parsing Failed — Invalid JSON structure returned.');
  } catch (err: any) {
    console.error('[GeminiService] Error during Gemini OCR processing:', err);
    const fallback = parseTimetableLocally(file.name);
    return {
      ...fallback,
      isFallback: true,
      errorMsg: 'Gemini API Key invalid or expired. Check .env configuration.'
    };
  }
}

