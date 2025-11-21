import { GoogleGenAI, Type } from "@google/genai";
import { CellType, GridConfig, EpisodeHistory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-2.5-flash";

export const generateMap = async (description: string): Promise<GridConfig | null> => {
  const prompt = `
    Generate a 2D grid layout for a reinforcement learning game.
    The grid should be 10x10.
    Characters:
    - 'E': Empty Space
    - 'W': Wall (Obstacle)
    - 'S': Start Position (Must have exactly one)
    - 'G': Goal/Treasure (Must have exactly one)
    - 'H': Hazard/Fire (Negative reward)

    User Description: ${description}
    
    Ensure there is a valid path from Start to Goal.
    Return ONLY the JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            width: { type: Type.INTEGER },
            height: { type: Type.INTEGER },
            layout: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    if (response.text) {
        const data = JSON.parse(response.text);
        const grid: CellType[][] = data.layout.map((row: string) => {
            return row.split('').map((char: string) => {
                switch(char) {
                    case 'W': return CellType.WALL;
                    case 'S': return CellType.START;
                    case 'G': return CellType.GOAL;
                    case 'H': return CellType.HAZARD;
                    default: return CellType.EMPTY;
                }
            });
        });
        return { width: 10, height: 10, grid };
    }
    return null;
  } catch (error) {
    console.error("Failed to generate map:", error);
    return null;
  }
};

export const analyzePerformance = async (history: EpisodeHistory[], agentParams: any): Promise<string> => {
  const recentHistory = history.slice(-20); // Last 20 episodes
  const prompt = `
    Analyze the performance of a Q-Learning agent.
    
    Current Parameters:
    Alpha (Learning Rate): ${agentParams.alpha}
    Gamma (Discount): ${agentParams.gamma}
    Epsilon (Exploration): ${agentParams.epsilon}

    Recent Performance (Last 20 episodes):
    ${JSON.stringify(recentHistory)}

    Provide a brief, encouraging, and tactical analysis (max 100 words) in CHINESE.
    Is the agent learning? Is it stuck? Should the user adjust parameters (e.g., lower epsilon to exploit more, or higher gamma to care more about future rewards)?
    Talk like a sci-fi AI researcher.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "Analysis unavailable.";
  } catch (error) {
    console.error("Analysis failed:", error);
    return "AI 核心通信中断。无法分析数据。";
  }
};