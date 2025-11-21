import { Action, AgentParams, AgentState, CellType, GridConfig } from '../types';

export class QLearningAgent {
  private qTable: Record<string, number[]> = {};
  private state: AgentState;
  private startPos: AgentState;
  private params: AgentParams;
  private gridConfig: GridConfig;

  constructor(gridConfig: GridConfig, params: AgentParams) {
    this.gridConfig = gridConfig;
    this.params = params;
    this.startPos = this.findStart();
    this.state = { ...this.startPos };
    this.initializeQTable();
  }

  private findStart(): AgentState {
    for (let y = 0; y < this.gridConfig.height; y++) {
      for (let x = 0; x < this.gridConfig.width; x++) {
        if (this.gridConfig.grid[y][x] === CellType.START) {
          return { x, y };
        }
      }
    }
    return { x: 0, y: 0 };
  }

  private initializeQTable() {
    // Reset or initialize Q-values for all states
    for (let y = 0; y < this.gridConfig.height; y++) {
      for (let x = 0; x < this.gridConfig.width; x++) {
        this.qTable[`${x},${y}`] = [0, 0, 0, 0];
      }
    }
  }

  private getStateKey(state: AgentState): string {
    return `${state.x},${state.y}`;
  }

  public resetPosition() {
    this.state = { ...this.startPos };
  }

  public updateParams(newParams: Partial<AgentParams>) {
    this.params = { ...this.params, ...newParams };
  }

  public getParams(): AgentParams {
    return this.params;
  }

  public getState(): AgentState {
    return this.state;
  }

  public getQValues(x: number, y: number): number[] {
    return this.qTable[`${x},${y}`] || [0, 0, 0, 0];
  }

  public chooseAction(): Action {
    const stateKey = this.getStateKey(this.state);
    
    // Epsilon-Greedy Strategy
    if (Math.random() < this.params.epsilon) {
      // Explore
      return Math.floor(Math.random() * 4);
    } else {
      // Exploit
      const qValues = this.qTable[stateKey];
      // Find max Q value and return its index. If tie, random among ties.
      const maxQ = Math.max(...qValues);
      const bestActions = qValues
        .map((q, i) => (q === maxQ ? i : -1))
        .filter((i) => i !== -1);
      return bestActions[Math.floor(Math.random() * bestActions.length)];
    }
  }

  public step(action: Action): { reward: number; done: boolean; won: boolean } {
    const { x, y } = this.state;
    let nextX = x;
    let nextY = y;

    // Determine next state based on action
    switch (action) {
      case Action.UP: nextY = Math.max(0, y - 1); break;
      case Action.RIGHT: nextX = Math.min(this.gridConfig.width - 1, x + 1); break;
      case Action.DOWN: nextY = Math.min(this.gridConfig.height - 1, y + 1); break;
      case Action.LEFT: nextX = Math.max(0, x - 1); break;
    }

    const cell = this.gridConfig.grid[nextY][nextX];
    
    // Collision logic
    if (cell === CellType.WALL) {
      nextX = x;
      nextY = y; // Stay in place if hit wall
    }

    const nextState = { x: nextX, y: nextY };
    
    // Calculate Reward
    let reward = -1; // Living penalty to encourage shortest path
    let done = false;
    let won = false;

    if (cell === CellType.GOAL) {
      reward = 100;
      done = true;
      won = true;
    } else if (cell === CellType.HAZARD) {
      reward = -100;
      done = true;
      won = false;
    } else if (cell === CellType.WALL) {
      reward = -5; // Penalty for hitting a wall
    }

    // Q-Learning Update Rule
    // Q(s,a) = Q(s,a) + alpha * [R + gamma * max(Q(s', a')) - Q(s,a)]
    const currentKey = this.getStateKey(this.state);
    const nextKey = this.getStateKey(nextState);
    
    const currentQ = this.qTable[currentKey][action];
    const maxNextQ = Math.max(...(this.qTable[nextKey] || [0, 0, 0, 0]));
    
    const newQ = currentQ + this.params.alpha * (reward + this.params.gamma * maxNextQ - currentQ);
    this.qTable[currentKey][action] = newQ;

    // Move agent
    this.state = nextState;

    return { reward, done, won };
  }

  public decayEpsilon() {
    if (this.params.epsilon > this.params.minEpsilon) {
      this.params.epsilon *= this.params.epsilonDecay;
    }
  }

  public setMap(newGrid: GridConfig) {
    this.gridConfig = newGrid;
    this.startPos = this.findStart();
    this.state = { ...this.startPos };
    this.initializeQTable(); // Reset memory on new map
  }
}