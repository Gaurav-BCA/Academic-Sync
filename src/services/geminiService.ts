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
  type?: string;
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
 * Convert a File object to base64 inline data string (without data URL prefix)
 * Handles both Image (image/png, image/jpeg) AND PDF (application/pdf) files dynamically.
 */
export async function fileToBase64(file: File): Promise<{ mimeType: string; data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.includes(',') ? result.split(',')[1] : result;

      let mimeType = file.type;
      if (!mimeType) {
        const lowerName = file.name.toLowerCase();
        if (lowerName.endsWith('.pdf')) mimeType = 'application/pdf';
        else if (lowerName.endsWith('.png')) mimeType = 'image/png';
        else if (lowerName.endsWith('.webp')) mimeType = 'image/webp';
        else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) mimeType = 'image/jpeg';
        else mimeType = 'application/pdf';
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
 * Call Google Gemini API (with dynamic multi-model fallback chain: gemini-3.8-flash -> gemini-flash-latest -> gemini-flash-lite-latest)
 * to parse timetable PDF/Image document via OCR.
 */
export async function parseTimetableWithGemini(file: File): Promise<GeminiParsedResult> {
  console.log("Processing file:", file.name, file.type);

  const apiKey = 
    import.meta.env.VITE_GEMINI_API_KEY || 
    (typeof process !== 'undefined' ? process?.env?.VITE_GEMINI_API_KEY : '') ||
    '';

  const grokApiKey = 
    import.meta.env.VITE_GROK_API_KEY || 
    import.meta.env.VITE_GROQ_API_KEY || 
    (typeof process !== 'undefined' ? (process?.env?.VITE_GROK_API_KEY || process?.env?.VITE_GROQ_API_KEY) : '') ||
    '';

  if (!apiKey && !grokApiKey) {
    const err = new Error('No API Key found. Please set VITE_GEMINI_API_KEY or VITE_GROK_API_KEY in your .env file.');
    console.error("Gemini OCR Error:", err);
    throw err;
  }

  const { mimeType: detectedMime, data: base64Data } = await fileToBase64(file);
  const mimeType = file.type || detectedMime || 'application/pdf';

  const promptText = `You are a strict academic timetable OCR parser. Inspect the uploaded timetable grid and bottom faculty/subject legend table. Cross-reference faculty codes (e.g., MM -> Mrs. Meenakshi Manchanda, CG -> Computer Graphics BCA 513, SE -> Software Engineering SE | 514). Extract ONLY the actual scheduled core subjects for each day (Mon to Sat) into this exact JSON format:
{
  "Mon": [{ "code": "BCA 512", "subject": "Java Programming", "time": "08:40 AM - 09:40 AM", "teacher": "Mrs. Meenakshi Manchanda (MM)", "room": "LH-302" }],
  "Tue": [],
  "Wed": [],
  "Thu": [],
  "Fri": [],
  "Sat": []
}
Ignore 'OFF' days or return empty array []. Output raw JSON only without markdown formatting or backticks.`;

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
      timetable: timetableResult,
      subjects: Array.from(subjectsMap.values())
    };
  };

  const parseJsonFromText = (rawText: string): GeminiParsedResult | null => {
    const cleanJsonText = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    try {
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
        const normalized = normalizeObjectSchedule(parsed);
        if (normalized.timetable.length > 0) {
          return {
            subjects: normalized.subjects,
            timetable: normalized.timetable,
            isFallback: false
          };
        }
      }
    } catch {
      // noop
    }
    return null;
  };

  // 1. Try Gemini API with multi-model fallback chain
  if (apiKey) {
    const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-flash-lite-latest'];

    for (const modelName of candidateModels) {
      console.log(`[GeminiService] Attempting OCR with model: ${modelName}`);

      // Try SDK first
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                { text: promptText },
                {
                  inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                  }
                }
              ]
            }
          ]
        });

        const parsedResult = parseJsonFromText(response.text || '');
        if (parsedResult) return parsedResult;
      } catch (sdkErr: any) {
        console.warn(`[GeminiService] SDK call for ${modelName} failed, trying REST API:`, sdkErr?.message || sdkErr);
      }

      // Try REST API fallback for model
      try {
        const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
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
                      data: base64Data,
                      mime_type: mimeType
                    }
                  }
                ]
              }
            ]
          })
        });

        if (res.ok) {
          const data = await res.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const parsedResult = parseJsonFromText(rawText);
          if (parsedResult) return parsedResult;
        } else {
          const errText = await res.text();
          console.warn(`[GeminiService] Model ${modelName} returned HTTP ${res.status}:`, errText);
        }
      } catch (restErr: any) {
        console.warn(`[GeminiService] REST call for ${modelName} failed:`, restErr);
      }
    }
  }

  // 2. Fallback to Grok / Groq API if VITE_GROK_API_KEY / VITE_GROQ_API_KEY is configured
  if (grokApiKey) {
    console.log("[GeminiService] Falling back to Grok/Groq API for OCR...");
    try {
      const isGroq = !!(import.meta.env.VITE_GROQ_API_KEY || (typeof process !== 'undefined' && process?.env?.VITE_GROQ_API_KEY));
      const endpoint = isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.x.ai/v1/chat/completions';
      const model = isGroq ? 'llama-3.2-11b-vision-preview' : 'grok-2-vision-1212';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${grokApiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: promptText },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64Data}`
                  }
                }
              ]
            }
          ]
        })
      });

      if (res.ok) {
        const data = await res.json();
        const rawText = data?.choices?.[0]?.message?.content || '';
        const parsedResult = parseJsonFromText(rawText);
        if (parsedResult) return parsedResult;
      }
    } catch (grokErr) {
      console.error("[GeminiService] Grok/Groq OCR fallback failed:", grokErr);
    }
  }

  throw new Error('All AI OCR providers/models are currently experiencing high demand. Please try clicking AUTO-PARSE TIMETABLE again in a few seconds.');
}
