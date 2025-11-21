export enum CellType {
  EMPTY = 'EMPTY',
  WALL = 'WALL',
  START = 'START',
  GOAL = 'GOAL',
  HAZARD = 'HAZARD'
}

export enum Action {
  UP = 0,
  RIGHT = 1,
  DOWN = 2,
  LEFT = 3
}

export interface GridConfig {
  width: number;
  height: number;
  grid: CellType[][];
}

export interface TrainingStats {
  episode: number;
  totalReward: number;
  epsilon: number;
  steps: number;
  won: boolean;
}

export interface AgentParams {
  alpha: number; // Learning Rate
  gamma: number; // Discount Factor
  epsilon: number; // Exploration Rate
  epsilonDecay: number;
  minEpsilon: number;
}

export interface AgentState {
  x: number;
  y: number;
}

// For Charting
export interface EpisodeHistory {
  episode: number;
  reward: number;
  steps: number;
}