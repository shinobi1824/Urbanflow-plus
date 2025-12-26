
import { GoogleGenAI, Type } from "@google/genai";
import { RouteResult, TransportMode } from "../types";

export async function parseNaturalLanguageQuery(query: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `User Mobility Request: "${query}". Identify destination and constraints. Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            destination: { type: Type.STRING },
            time: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["departure", "arrival"] },
            isAccessible: { type: Type.BOOLEAN }
          },
          required: ["destination"]
        },
        systemInstruction: "You are an expert urban mobility analyzer for UrbanFlow+. Extract destination and time intent accurately."
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    return { destination: query };
  }
}

export function generateMockRoutes(destination: string, isPremium: boolean = false): RouteResult[] {
  return [
    {
      id: "fast-1",
      totalTime: 18,
      startTime: "08:15",
      endTime: "08:33",
      cost: 4.40,
      walkingDistance: 450,
      transfers: 1,
      co2Savings: 920,
      isAccessible: true,
      isPremium: true,
      aiReasoning: "Opción más veloz. Utiliza carril bus exclusivo para saltar el atasco en la avenida principal.",
      steps: [
        { mode: TransportMode.WALK, instruction: "Camina a Parada A", durationMinutes: 5 },
        { mode: TransportMode.BUS, instruction: "Bus Express 101", durationMinutes: 10, lineName: "101", color: "#3B82F6" },
        { mode: TransportMode.WALK, instruction: "Llegada", durationMinutes: 3 }
      ]
    },
    {
      id: "cheap-1",
      totalTime: 35,
      startTime: "08:10",
      endTime: "08:45",
      cost: 2.20,
      walkingDistance: 800,
      transfers: 0,
      co2Savings: 1100,
      isAccessible: false,
      aiReasoning: "Ahorra 50% en costo usando tarifa social de bus local directo.",
      steps: [
        { mode: TransportMode.WALK, instruction: "Caminata al bus local", durationMinutes: 10 },
        { mode: TransportMode.BUS, instruction: "Bus Social 404", durationMinutes: 20, lineName: "404", color: "#EF4444" },
        { mode: TransportMode.WALK, instruction: "Llegada", durationMinutes: 5 }
      ]
    },
    {
      id: "lowwalk-1",
      totalTime: 25,
      startTime: "08:15",
      endTime: "08:40",
      cost: 4.40,
      walkingDistance: 150,
      transfers: 2,
      co2Savings: 850,
      isAccessible: true,
      aiReasoning: "Mínimo esfuerzo físico. Puerta a puerta mediante transbordos cortos sincronizados.",
      steps: [
        { mode: TransportMode.WALK, instruction: "Parada a la vuelta", durationMinutes: 2 },
        { mode: TransportMode.BUS, instruction: "Bus Alimentador", durationMinutes: 8, lineName: "A1", color: "#10B981" },
        { mode: TransportMode.METRO, instruction: "Metro Línea 1", durationMinutes: 15, lineName: "L1", color: "#3B82F6" }
      ]
    }
  ];
}
