
import { GoogleGenAI, Type } from "@google/genai";
import { RouteResult, TransportMode, Coordinates } from "../types";
import { OTPService } from "./otp";
import { ExternalServices } from "./external";

// Inicializamos el cliente.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

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
              aiReasoning: { type: Type.STRING },
              isAccessible: { type: Type.BOOLEAN },
              startTime: { type: Type.STRING },
              endTime: { type: Type.STRING },
              isPremium: { type: Type.BOOLEAN },
              weatherAlert: { type: Type.STRING, nullable: true },
              safetyScore: { type: Type.NUMBER, nullable: true },
              caloriesBurned: { type: Type.NUMBER },
              trafficDelayMinutes: { type: Type.NUMBER, nullable: true },
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

    // Sanitize response before parsing
    const cleanText = cleanJson(response.text || "[]");
    const routes = JSON.parse(cleanText);
    
    if (!routes.length && useGenerativeFallback) throw new Error("No routes generated");
    
    // Filtrado de características Premium vs Básico
    return routes.map((r: any) => {
      // Defensive check for steps
      const steps = r.steps || [];
      const isRideShare = steps.some((s:any) => s.mode === 'ride');
      
      return { 
        ...r, 
        steps,
        // Si NO es usuario premium y NO es un viaje de Uber (que siempre tiene info básica), censuramos la IA y el tráfico
        aiReasoning: isPremiumUser ? r.aiReasoning : "LOCKED_PREMIUM",
        trafficDelayMinutes: isPremiumUser ? r.trafficDelayMinutes : undefined,
        // Marcar como 'isPremium' (bandera de UI) si es caro
        isPremium: r.cost > 10 
      };
    });

  } catch (error) {
    console.error("AI Routing failed completely:", error);
    return getFallbackRoutes(destination);
  }
}

export function getFallbackRoutes(destination: string): RouteResult[] {
  // FALLBACK ACTUALIZADO: Simulando opciones variadas tipo Moovit
  return [
    {
      id: "rec-1",
      totalTime: 35,
      startTime: "14:00",
      endTime: "14:35",
      cost: 4.50,
      walkingDistance: 350,
      transfers: 1,
      co2Savings: 450,
      isAccessible: true,
      caloriesBurned: 40,
      aiReasoning: "Ruta recomendada: Balance tiempo/costo.",
      isPremium: false,
      steps: [
        { mode: TransportMode.WALK, instruction: "Caminar a estación", durationMinutes: 5 },
        { mode: TransportMode.METRO, instruction: "Metro Línea 4", durationMinutes: 20, lineName: "L4", color: "#EF4444" },
        { mode: TransportMode.BUS, instruction: "Bus 857R hacia centro", durationMinutes: 10, lineName: "857R", color: "#3B82F6" }
      ]
    },
    {
      id: "cheap-1",
      totalTime: 55,
      startTime: "14:05",
      endTime: "15:00",
      cost: 2.20,
      walkingDistance: 150,
      transfers: 0,
      co2Savings: 600,
      isAccessible: true,
      caloriesBurned: 15,
      aiReasoning: "Opción más barata. Solo autobús.",
      isPremium: false,
      steps: [
        { mode: TransportMode.WALK, instruction: "Caminar a parada", durationMinutes: 5 },
        { mode: TransportMode.BUS, instruction: "Bus Directo Interurbano", durationMinutes: 50, lineName: "201", color: "#F59E0B" }
      ]
    },
    {
      id: "ride-1",
      totalTime: 18,
      startTime: "Ahora",
      endTime: "+18m",
      cost: 15.90,
      walkingDistance: 0,
      transfers: 0,
      co2Savings: 0,
      isAccessible: true,
      caloriesBurned: 0,
      aiReasoning: "Más rápido. Servicio de transporte privado.",
      isPremium: true,
      steps: [
        { mode: TransportMode.RIDE, instruction: "Viaje en Uber/Bolt", durationMinutes: 18, lineName: "UberX" }
      ]
    }
  ];
}
