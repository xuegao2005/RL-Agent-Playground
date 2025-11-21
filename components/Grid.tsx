import React from 'react';
import { CellType, GridConfig, AgentState } from '../types';
import { QLearningAgent } from '../services/rlAgent';

interface GridProps {
  config: GridConfig;
  agentState: AgentState;
  agent: QLearningAgent;
  showQValues: boolean;
}

const Grid: React.FC<GridProps> = ({ config, agentState, agent, showQValues }) => {
  
  const getCellColor = (type: CellType, x: number, y: number) => {
    switch (type) {
      case CellType.WALL: return 'bg-slate-800 border-slate-700';
      case CellType.START: return 'bg-blue-900/30 border-blue-800';
      case CellType.GOAL: return 'bg-emerald-900/30 border-emerald-800';
      case CellType.HAZARD: return 'bg-red-900/30 border-red-800';
      default: 
        if (showQValues) {
             const qValues = agent.getQValues(x, y);
             const maxQ = Math.max(...qValues);
             // Normalize roughly for visualization (-100 to 100 range usually)
             if (maxQ > 1) return 'bg-green-500/20 border-slate-800'; // Good path
             if (maxQ < -1) return 'bg-red-500/10 border-slate-800'; // Bad path
        }
        return 'bg-slate-900 border-slate-800';
    }
  };

  const getIcon = (type: CellType) => {
    switch (type) {
      case CellType.WALL: return '';
      case CellType.START: return '🚩';
      case CellType.GOAL: return '💎';
      case CellType.HAZARD: return '🔥';
      default: return '';
    }
  };

  // Calculate Q-arrows for overlay
  const renderArrows = (x: number, y: number) => {
    if (!showQValues || config.grid[y][x] === CellType.WALL) return null;
    
    const q = agent.getQValues(x, y);
    const maxQ = Math.max(...q);
    if (maxQ === 0 && q.every(v => v === 0)) return null;

    const bestAction = q.indexOf(maxQ);
    const rotation = bestAction * 90; // 0=UP, 1=RIGHT, 2=DOWN, 3=LEFT
    
    return (
       <div 
         className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none"
         style={{ transform: `rotate(${rotation}deg)` }}
       >
          <span className="text-xs text-cyan-400">⬆</span>
       </div>
    );
  };

  return (
    <div 
      className="grid gap-1 p-1 bg-slate-800/50 rounded-lg border border-slate-700 shadow-xl"
      style={{ 
        gridTemplateColumns: `repeat(${config.width}, minmax(0, 1fr))`,
        aspectRatio: '1/1'
      }}
    >
      {config.grid.map((row, y) => (
        row.map((cell, x) => {
          const isAgent = agentState.x === x && agentState.y === y;
          return (
            <div
              key={`${x}-${y}`}
              className={`relative w-full h-full border rounded flex items-center justify-center text-xl select-none transition-colors duration-150 ${getCellColor(cell, x, y)}`}
            >
              {/* Background Icon */}
              <span className="opacity-80">{getIcon(cell)}</span>

              {/* Q-Value Direction Hint */}
              {renderArrows(x, y)}

              {/* Agent Overlay */}
              {isAgent && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-3/4 h-3/4 bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.6)] flex items-center justify-center text-sm animate-pulse">
                        🤖
                    </div>
                </div>
              )}
            </div>
          );
        })
      ))}
    </div>
  );
};

export default Grid;