import React from 'react';
import { AgentParams } from '../types';

interface ControlPanelProps {
  params: AgentParams;
  onParamChange: (key: keyof AgentParams, value: number) => void;
  speed: number;
  setSpeed: (val: number) => void;
  isTraining: boolean;
  onToggleTraining: () => void;
  onReset: () => void;
}

const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}> = ({ label, value, min, max, step, onChange, disabled }) => (
  <div className="mb-3">
    <div className="flex justify-between mb-1">
      <label className="text-xs font-medium text-slate-400">{label}</label>
      <span className="text-xs text-cyan-400 font-mono">{value.toFixed(3)}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      disabled={disabled}
      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-50"
    />
  </div>
);

const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  onParamChange,
  speed,
  setSpeed,
  isTraining,
  onToggleTraining,
  onReset
}) => {
  return (
    <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg">
      <div className="flex items-center justify-between mb-4">
         <h2 className="text-lg font-bold text-white flex items-center gap-2">
            🎛 控制系统
         </h2>
         <div className={`h-2 w-2 rounded-full ${isTraining ? 'bg-green-500 animate-ping' : 'bg-red-500'}`} />
      </div>

      <div className="space-y-4">
        <Slider 
            label="Epsilon (探索率/随机性)" 
            value={params.epsilon} 
            min={0} max={1} step={0.01} 
            onChange={(v) => onParamChange('epsilon', v)} 
        />
        <Slider 
            label="Alpha (学习率)" 
            value={params.alpha} 
            min={0.01} max={1} step={0.01} 
            onChange={(v) => onParamChange('alpha', v)} 
        />
        <Slider 
            label="Gamma (折扣因子/远见)" 
            value={params.gamma} 
            min={0.1} max={0.99} step={0.01} 
            onChange={(v) => onParamChange('gamma', v)} 
        />
        
        <div className="border-t border-slate-700 my-4 pt-4"></div>

        <Slider 
            label="模拟速度 (毫秒延迟)" 
            value={speed} 
            min={0} max={500} step={10} 
            onChange={setSpeed} 
        />

        <div className="grid grid-cols-2 gap-3 mt-6">
            <button
                onClick={onToggleTraining}
                className={`py-2 px-4 rounded-lg font-bold transition-all ${
                    isTraining 
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50' 
                    : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/50'
                }`}
            >
                {isTraining ? '停止系统' : '开始运行'}
            </button>
            <button
                onClick={onReset}
                className="py-2 px-4 rounded-lg font-bold bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600 transition-all"
            >
                重置
            </button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;