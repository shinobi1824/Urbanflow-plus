import { GoogleGenAI, Type } from "@google/genai";
import { RouteResult, TransportMode, Coordinates } from "../types";
import { OTPService } from "./otp";
import { ExternalServices } from "./external";

// Inicializamos el cliente de manera segura para evitar crashes si la API Key falla
let ai: GoogleGenAI;
try {
  // Use a fallback to prevent constructor error, though API calls will fail if invalid
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'MISSING_KEY' });
} catch (e) {
  console.error("Critical: Failed to initialize GoogleGenAI", e);
  // Mock minimal interface to prevent crash usage
  ai = { models: { generateContent: async () => { throw new Error("AI not initialized"); } } } as any;
}

// Helper para limpiar respuestas de Gemini que incluyen bloques de código markdown
const cleanJson = (text: string) => {
  if (!text) return "{}";
  let clean = text.trim();
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json/, '').replace(/```$/, '');
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```/, '').replace(/```$/, '');
  }
  return clean;
};

export async function parseNaturalLanguageQuery(query: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract destination from: "${query}". Return JSON with "destination" field.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            destination: { type: Type.STRING },
          },
          required: ["destination"]
        }
      }
    });
    
    const result = JSON.parse(cleanJson(response.text || "{}"));
    return { destination: result.destination || query };
  } catch (error) {
    console.warn("NLP Parse failed, using raw query:", error);
    return { destination: query };
  }
}

export function getFallbackRoutes(): RouteResult[] {
  return [
    {
      id: 'fallback-1',
      totalTime: 45,
      cost: 4.50,
      walkingDistance: 500,
      transfers: 1,
      co2Savings: 120,
      steps: [
        { mode: TransportMode.WALK, instruction: 'Caminar a estación', durationMinutes: 10 },
        { mode: TransportMode.METRO, instruction: 'Tomar Línea Azul', durationMinutes: 30, lineName: 'L1', color: '#3B82F6' },
        { mode: TransportMode.WALK, instruction: 'Caminar a destino', durationMinutes: 5 }
      ],
      aiReasoning: "Ruta offline/fallback generada localmente.",
      isAccessible: true,
      startTime: "Ahora",
      endTime: "45 min"
    }
  ];
}

export async function generateSmartRoutes(
  destination: string, 
  weather: any,
  userLocation?: Coordinates,
  isPremiumUser: boolean = false
): Promise<RouteResult[]> {
  try {
    // 1. Obtener coordenadas reales del destino
    const destCoords = await ExternalServices.searchAddress(destination);
    
    // Usar ubicación del usuario o un default si no hay GPS (Fallback Sao Paulo)
    const originCoords = userLocation || { lat: -23.5615, lng: -46.6559 }; 

    // 2. Intentar obtener rutas reales desde OpenTripPlanner (Motor Transmodel)
    let realRoutes: RouteResult[] = [];
    try {
        realRoutes = await OTPService.planTrip(originCoords, destCoords);
    } catch (e) {
        console.log("OTP Skipped or Failed");
    }
    
    // 3. Si OTP falla, usar fallback puro de IA
    const useGenerativeFallback = realRoutes.length === 0;

    let prompt = "";

    if (!useGenerativeFallback) {
      prompt = `
        You are an Urban Mobility AI Enhancer.
        I have these REAL technical routes: ${JSON.stringify(realRoutes)}.
        Current Weather: ${weather.condition}, ${weather.temp}°C.
        ENHANCE these routes. Add reasoning, safety scores, and compare with a estimated Uber/Ride price.
      `;
    } else {
      // PROMPT MEJORADO PARA ESTILO MOOVIT
      prompt = `
        Act as a Transit Planner like Moovit. 
        Origin Lat/Lng: ${originCoords.lat}, ${originCoords.lng}.
        Destination: "${destination}".
        
        Generate 4 DISTINCT route options with realistic PRICING (currency: local unit $):
        1. Best Public Transit (Metro + Walk).
        2. Cheapest Option (Bus only).
        3. Multi-modal (Bus + Metro).
        4. Ride-Hailing (Uber/Cab) - fast but expensive.
        
        Use REAL LINE NAMES (e.g. "L4", "Bus 201", "Red Line").
        
        Context: Weather is ${weather.condition}, ${weather.temp}°C.
        
        Output JSON matching RouteResult schema.
      `;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              totalTime: { type: Type.NUMBER },
              cost: { type: Type.NUMBER },
              walkingDistance: { type: Type.NUMBER },
              transfers: { type: Type.NUMBER },
              co2Savings: { type: Type.NUMBER },
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    mode: { type: Type.STRING, description: "walk, bus, metro, train, bike, ride, scooter" },
                    instruction: { type: Type.STRING },
                    durationMinutes: { type: Type.NUMBER },
                    lineName: { type: Type.STRING },
                    color: { type: Type.STRING }
                  },
                  required: ["mode", "instruction", "durationMinutes"]
                }
              },
              aiReasoning: { type: Type.STRING },
              isAccessible: { type: Type.BOOLEAN },
              startTime: { type: Type.STRING },
              endTime: { type: Type.STRING },
            },
            required: ["id", "totalTime", "cost", "steps", "startTime", "endTime"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");

    const generatedRoutes = JSON.parse(cleanJson(text));
    
    // Assign IDs if missing and ensure Types
    return generatedRoutes.map((r: any, i: number) => ({
      ...r,
      id: r.id || `gen-${i}-${Date.now()}`,
      // ensure steps is array
      steps: r.steps || []
    }));

  } catch (error) {
    console.error("Generative Route Failed", error);
    return getFallbackRoutes();
  }
}