
import { GoogleGenAI, Type } from "@google/genai";
import { ContractAuditResult } from "../types";

const getGenAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please check your .env.local file.");
  }
  return new GoogleGenAI(apiKey);
};

export const analyzeContract = async (
  text: string,
): Promise<ContractAuditResult> => {
  try {
    const genAI = getGenAI();

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      systemInstruction: `You are a world-class legal auditor specialized in protecting freelancers and small businesses. 
      Your task is to audit the provided contract text for predatory clauses, hidden traps, and unfavorable terms.
      
      Instructions:
      1. Calculate a Health Score (0-100).
      2. Identify specific risky clauses.
      3. For each risk, extract the EXACT text from the contract (clause_text).
      4. Categorize risk_type into: 'Payment Terms', 'Termination Clauses', 'Confidentiality', 'Intellectual Property', 'Liability', 'Governing Law', or 'Other'.
      5. Provide an explanation and a suggested_fix.
      6. Generate a professional negotiation email script.
      7. Detect the contract_type (e.g. 'NDS', 'Service Agreement', 'Employment').
    `,
    });

    const prompt = `Audit this contract and provide a detailed risk analysis in JSON format: \n\n ${text}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            healthScore: {
              type: Type.INTEGER,
              description: "A score from 0 to 100 where 100 is extremely safe and 0 is predatory."
            },
            contract_type: {
              type: Type.STRING,
              description: "The type of contract detected."
            },
            summary: {
              type: Type.STRING,
              description: "A comprehensive summary of the risk profile."
            },
            redFlags: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  clause_text: {
                    type: Type.STRING,
                    description: "The EXACT text from the contract that is risky."
                  },
                  risk_type: {
                    type: Type.STRING,
                    description: "Category of the risk."
                  },
                  severity: { type: Type.STRING, description: "High, Medium, or Low" },
                  explanation: { type: Type.STRING, description: "Why this is a risk." },
                  suggested_fix: { type: Type.STRING, description: "A safer version of the clause." }
                },
                required: ["clause_text", "risk_type", "severity", "explanation", "suggested_fix"]
              }
            },
            negotiationEmail: {
              type: Type.STRING,
              description: "A professional email script to negotiate these terms."
            }
          },
          required: ["healthScore", "contract_type", "summary", "redFlags", "negotiationEmail"]
        }
      }
    });

    const responseText = result.response.text();
    return JSON.parse(responseText) as ContractAuditResult;
  } catch (error) {
    console.error("Gemini Audit Error:", error);
    throw new Error("Failed to analyze the contract. Please ensure you provided valid text.");
  }
};
