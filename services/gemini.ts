
import { GoogleGenAI, Type } from "@google/genai";
import { RouteResult, TransportMode, Coordinates } from "../types";
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

export async function generateSmartRoutes(
  destination: string, 
  weather: any,
  userLocation?: Coordinates
): Promise<RouteResult[]> {
  try {
    // 1. Obtener coordenadas reales del destino
    const destCoords = await ExternalServices.searchAddress(destination);
    
    // Usar ubicación del usuario o un default si no hay GPS (Fallback Sao Paulo)
    const originCoords = userLocation || { lat: -23.5615, lng: -46.6559 }; 

    // 2. Intentar obtener rutas reales desde OpenTripPlanner (Motor Transmodel)
    // Nota: Esto fallará si el OTP Endpoint no cubre la zona del usuario (ej: fuera de Europa para Entur)
    let realRoutes: RouteResult[] = [];
    try {
        realRoutes = await OTPService.planTrip(originCoords, destCoords);
    } catch (e) {
        console.log("OTP Skipped or Failed");
    }
    
    // 3. Si OTP falla (no hay servidor configurado o error de red), usar fallback puro de IA
    const useGenerativeFallback = realRoutes.length === 0;

    let prompt = "";

    if (!useGenerativeFallback) {
      // MODO HÍBRIDO: Datos Reales + Enriquecimiento IA
      prompt = `
        You are an Urban Mobility AI Enhancer.
        I have these REAL technical routes: ${JSON.stringify(realRoutes)}.
        Current Weather: ${weather.condition}, ${weather.temp}°C.
        ENHANCE these routes. Add reasoning and safety scores.
      `;
    } else {
      // MODO GENERATIVO PURO (Fallback Inteligente con Ubicación Real)
      prompt = `
        Act as a Local Transit Expert. 
        I am at Latitude: ${originCoords.lat}, Longitude: ${originCoords.lng}.
        I want to go to: "${destination}".
        
        Generate 3 REALISTIC routes (Fastest, Cheapest, Eco) for this specific city/area based on my coordinates.
        Use real local transport names (e.g. if in Mexico use Metro/Pesero, if in Bogota use TransMilenio).
        
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
  // Rutas estáticas de emergencia si Gemini y OTP fallan
  return [
    {
      id: "fallback-1",
      totalTime: 25,
      startTime: "Now",
      endTime: "+25m",
      cost: 2.50,
      walkingDistance: 400,
      transfers: 1,
      co2Savings: 300,
      isAccessible: true,
      caloriesBurned: 50,
      aiReasoning: "Modo Offline: Ruta estimada directa.",
      isPremium: false,
      steps: [
        { mode: TransportMode.WALK, instruction: "Caminar a estación principal", durationMinutes: 5 },
        { mode: TransportMode.BUS, instruction: `Transporte a ${destination}`, durationMinutes: 20, lineName: "Ruta Directa" }
      ]
    }
  ];
}
