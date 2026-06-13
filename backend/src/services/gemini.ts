import { GoogleGenAI, Type } from '@google/genai';
import { HttpError } from '../middleware/errorHandler.js';

export interface GeminiRisk {
  title: string;
  severity: 'high' | 'medium' | 'low';
  clause: string;
  explanation: string;
  fix: string;
  negotiation_reply: string;
}

export interface GeminiAnalysisResult {
  health_score: number;
  summary: string;
  risks: GeminiRisk[];
}

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new HttpError(500, 'GEMINI_API_KEY is not configured on the backend');
  }

  return new GoogleGenAI({ apiKey });
};

const getRawResponseText = (response: { text?: string | (() => string) }): string => {
  if (typeof response.text === 'function') {
    return response.text();
  }

  return response.text || '';
};

const stripJsonFence = (text: string) => text
  .replace(/```json/g, '')
  .replace(/```/g, '')
  .trim();

const parseJsonSafely = (raw: string): GeminiAnalysisResult => {
  try {
    const cleaned = stripJsonFence(raw);
    const parsed = JSON.parse(cleaned) as GeminiAnalysisResult;

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid analysis payload');
    }

    if (!parsed || typeof parsed.health_score !== 'number' || typeof parsed.summary !== 'string' || !Array.isArray(parsed.risks)) {
      throw new Error('Invalid analysis payload');
    }

    parsed.health_score = Math.max(0, Math.min(100, Math.round(parsed.health_score)));
    parsed.summary = parsed.summary.trim();
    parsed.risks = parsed.risks
      .filter((risk) => risk && typeof risk.title === 'string' && typeof risk.clause === 'string')
      .map((risk) => ({
        title: risk.title.trim(),
        severity: ['high', 'medium', 'low'].includes(risk.severity) ? risk.severity : 'low',
        clause: risk.clause.trim(),
        explanation: risk.explanation?.trim() || 'No explanation provided.',
        fix: risk.fix?.trim() || 'No suggested fix provided.',
        negotiation_reply: risk.negotiation_reply?.trim() || '',
      }));

    return parsed;
  } catch {
    throw new HttpError(502, 'Invalid AI response');
  }
};

const toGeminiError = (error: unknown): HttpError => {
  const message = error instanceof Error ? error.message : String(error);

  if (/RESOURCE_EXHAUSTED|quota exceeded|429/i.test(message)) {
    return new HttpError(503, 'Gemini quota exceeded. Please check billing or try again later.');
  }

  if (/NOT_FOUND|not found/i.test(message)) {
    return new HttpError(502, 'Gemini model not available on this API key');
  }

  return new HttpError(502, 'Gemini request failed');
};

export const analyzeWithGemini = async (contractText: string, userRole: string): Promise<GeminiAnalysisResult> => {
  const client = getClient();

  const prompt = `Analyze this contract for the role: ${userRole}

Contract text:
${contractText}

Return only valid JSON.
Do not use markdown.
Do not use code blocks.
Do not include explanations outside JSON.

Expected schema:
{
  "health_score": number,
  "summary": string,
  "risks": [
    {
      "title": string,
      "severity": "high" | "medium" | "low",
      "clause": string,
      "explanation": string,
      "fix": string,
      "negotiation_reply": string
    }
  ]
}`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are a world-class contract analyst for freelancers, designers, developers, consultants, and small startups.

Return only valid JSON with this exact shape:
{
  "health_score": number,
  "summary": string,
  "risks": [
    {
      "title": string,
      "severity": "high" | "medium" | "low",
      "clause": string,
      "explanation": string,
      "fix": string,
      "negotiation_reply": string
    }
  ]
}

Rules:
- Extract the most relevant risky clauses from the supplied contract text.
- Keep the summary concise and specific.
- If there are no major risks, return an empty risks array.
- negotiation_reply should be a short, practical reply the user can send.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            health_score: { type: Type.INTEGER },
            summary: { type: Type.STRING },
            risks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  severity: { type: Type.STRING },
                  clause: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  fix: { type: Type.STRING },
                  negotiation_reply: { type: Type.STRING },
                },
                required: ['title', 'severity', 'clause', 'explanation', 'fix', 'negotiation_reply'],
              },
            },
          },
          required: ['health_score', 'summary', 'risks'],
        },
      },
    });

    console.log('AI response received');

    const responseText = getRawResponseText(response as unknown as { text?: string | (() => string) });

    if (!responseText) {
      throw new HttpError(502, 'The model returned an empty response');
    }

    const parsed = parseJsonSafely(responseText);
    console.log('parsed JSON', parsed);
    return parsed;
  } catch (error) {
    throw toGeminiError(error);
  }
};