
import { GoogleGenAI, Type } from "@google/genai";
import { RouteResult, TransportMode } from "../types";
import { OTPService } from "./otp";
import { ExternalServices } from "./external";

// Inicializamos el cliente.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

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
    const result = JSON.parse(response.text || "{}");
    return { destination: result.destination || query };
  } catch (error) {
    console.warn("NLP Parse failed, using raw query:", error);
    return { destination: query };
  }
}

export async function generateSmartRoutes(destination: string, weather: any): Promise<RouteResult[]> {
  try {
    // 1. Obtener coordenadas reales del destino
    const destCoords = await ExternalServices.searchAddress(destination);
    
    // Simulación de origen (Av. Paulista, SP)
    const originCoords = { lat: -23.5615, lng: -46.6559 }; 

    // 2. Intentar obtener rutas reales desde OpenTripPlanner (Motor Transmodel)
    let realRoutes = await OTPService.planTrip(originCoords, destCoords);
    
    // 3. Si OTP falla (no hay servidor configurado o error de red), usar fallback puro de IA
    const useGenerativeFallback = realRoutes.length === 0;

    let prompt = "";

    if (!useGenerativeFallback) {
      // MODO HÍBRIDO: Datos Reales + Enriquecimiento IA
      // Pasamos los datos técnicos a Gemini para que agregue el "sabor" (razonamiento, clima, etc)
      prompt = `
        You are an Urban Mobility AI Enhancer.
        I have these REAL technical routes from OpenTripPlanner: ${JSON.stringify(realRoutes)}.
        
        Current Weather: ${weather.condition}, ${weather.temp}°C.

        Please ENHANCE these routes. Do NOT change the steps, times, or costs significantly.
        
        Tasks:
        1. Add a persuasive "aiReasoning" (in Spanish) based on the weather and route type.
        2. Calculate realistic "co2Savings" (g) compared to a car.
        3. Assign a "safetyScore" (0-100).
        4. Add a "weatherAlert" string if the weather is bad and the route involves walking.
        5. Return the SAME JSON structure but enriched.
      `;
    } else {
      // MODO GENERATIVO PURO (Fallback)
      prompt = `
        Act as a Transit Engine. Generate 3 distinct routes from "Current Location" to "${destination}".
        
        Context: Weather is ${weather.condition}, ${weather.temp}°C.
        
        Routes required: 1. Fastest, 2. Cheapest, 3. Eco-friendly.

        For EACH route:
        - Create realistic steps (Walk, Bus, Metro).
        - Estimate duration/cost.
        - "aiReasoning": A short persuasive sentence (in Spanish).
        
        Output JSON matching the RouteResult schema.
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
              aiReasoning: { type: Type.STRING },
              isAccessible: { type: Type.BOOLEAN },
              startTime: { type: Type.STRING },
              endTime: { type: Type.STRING },
              isPremium: { type: Type.BOOLEAN },
              weatherAlert: { type: Type.STRING, nullable: true },
              safetyScore: { type: Type.NUMBER, nullable: true },
              caloriesBurned: { type: Type.NUMBER },
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    mode: { type: Type.STRING, enum: ["walk", "bus", "metro", "train", "bike", "ride", "scooter"] },
                    instruction: { type: Type.STRING },
                    durationMinutes: { type: Type.NUMBER },
                    lineName: { type: Type.STRING, nullable: true },
                    color: { type: Type.STRING, nullable: true }
                  },
                  required: ["mode", "instruction", "durationMinutes"]
                }
              }
            },
            required: ["id", "totalTime", "cost", "steps", "aiReasoning"]
          }
        }
      }
    });

    const routes = JSON.parse(response.text || "[]");
    
    if (!routes.length && useGenerativeFallback) throw new Error("No routes generated");
    
    // Marcar como premium
    return routes.map((r: any) => ({ ...r, isPremium: true }));

  } catch (error) {
    console.error("AI Routing failed completely:", error);
    return getFallbackRoutes(destination);
  }
}

export function getFallbackRoutes(destination: string): RouteResult[] {
  return [
    {
      id: "fallback-1",
      totalTime: 22,
      startTime: "09:00",
      endTime: "09:22",
      cost: 4.50,
      walkingDistance: 300,
      transfers: 1,
      co2Savings: 500,
      isAccessible: true,
      caloriesBurned: 45,
      aiReasoning: "🔒 Análisis IA bloqueado. Actualiza a Premium.",
      isPremium: false,
      steps: [
        { mode: TransportMode.WALK, instruction: "Caminar a parada", durationMinutes: 5 },
        { mode: TransportMode.BUS, instruction: `Bus estándar a ${destination}`, durationMinutes: 15, lineName: "Ruta 101" },
        { mode: TransportMode.WALK, instruction: "Llegada", durationMinutes: 2 }
      ]
    },
    {
      id: "fallback-2",
      totalTime: 45,
      startTime: "09:00",
      endTime: "09:45",
      cost: 2.00,
      walkingDistance: 900,
      transfers: 2,
      co2Savings: 800,
      isAccessible: false,
      caloriesBurned: 120,
      aiReasoning: "🔒 Análisis IA bloqueado.",
      isPremium: false,
      steps: [
        { mode: TransportMode.WALK, instruction: "Caminata larga", durationMinutes: 15 },
        { mode: TransportMode.METRO, instruction: "Metro Línea B", durationMinutes: 25, lineName: "LB" },
        { mode: TransportMode.WALK, instruction: "Llegada", durationMinutes: 5 }
      ]
    }
  ];
}
