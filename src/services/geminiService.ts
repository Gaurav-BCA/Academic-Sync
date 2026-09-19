import { GoogleGenAI } from '@google/genai';

export interface TimetableSlot {
  time: string;
  subject: string;
  subjectCode: string;
  faculty: string;
  room: string;
  type?: string;
}

export interface DaySchedule {
  day: string;
  slots: TimetableSlot[];
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
      resolve({
        mimeType: file.type || 'image/jpeg',
        data: base64Data
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Parse timetable image using Gemini 2.5 Flash API
 */
export async function parseTimetableWithGemini(file: File): Promise<DaySchedule[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is missing. Please check VITE_GEMINI_API_KEY or VITE_FIREBASE_API_KEY.');
  }

  const base64Image = await fileToBase64(file);

  const promptText = `Extract the weekly academic timetable schedule from this image into a JSON array format.
Return ONLY valid JSON matching this TypeScript type definition without any markdown formatting or commentary:

[
  {
    "day": "Monday",
    "slots": [
      {
        "time": "09:00",
        "subject": "Subject Name",
        "subjectCode": "CODE101",
        "faculty": "Prof. Name",
        "room": "Room 302"
      }
    ]
  }
]

Include days of the week (Monday to Saturday) present in the timetable. Ensure each slot includes time, subject, subjectCode, faculty, and room. If any field is unavailable or not specified, use reasonable defaults or empty strings. Return pure raw JSON ONLY.`;

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
                mimeType: base64Image.mimeType,
                data: base64Image.data
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
    if (Array.isArray(parsed)) {
      return parsed as DaySchedule[];
    }
    throw new Error('Unexpected JSON structure returned by Gemini AI');
  } catch (err: any) {
    console.warn('Gemini 2.5 Flash SDK call notice, attempting REST endpoint fallback:', err);
    
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
                  mime_type: base64Image.mimeType,
                  data: base64Image.data
                }
              }
            ]
          }
        ]
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API request failed: ${res.statusText || errText}`);
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanJson = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const parsedData = JSON.parse(cleanJson);
    if (Array.isArray(parsedData)) {
      return parsedData as DaySchedule[];
    }
    throw new Error('Could not parse timetable JSON from Gemini response.');
  }
}
