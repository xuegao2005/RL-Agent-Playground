import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { EpisodeHistory } from '../types';

interface ChartsProps {
  history: EpisodeHistory[];
}

const Charts: React.FC<ChartsProps> = ({ history }) => {
  const data = history.slice(-50); // Show last 50 episodes

  return (
    <div className="h-64 w-full bg-slate-900/50 rounded-lg border border-slate-800 p-4">
      <h3 className="text-sm font-semibold text-slate-400 mb-2">每回合奖励 (最近50次)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="episode" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
            itemStyle={{ color: '#38bdf8' }}
          />
          <Line 
            type="monotone" 
            dataKey="reward" 
            stroke="#38bdf8" 
            strokeWidth={2}
            dot={false}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Charts;