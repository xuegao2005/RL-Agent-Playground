import React, { useState, useEffect, useRef, useCallback } from 'react';
import Grid from './components/Grid';
import ControlPanel from './components/ControlPanel';
import Charts from './components/Charts';
import { CellType, GridConfig, AgentParams, EpisodeHistory, AgentState } from './types';
import { QLearningAgent } from './services/rlAgent';
import { generateMap, analyzePerformance } from './services/geminiService';

// Default Grid 10x10
const INITIAL_GRID: GridConfig = {
  width: 10,
  height: 10,
  grid: Array(10).fill(null).map((_, y) => 
    Array(10).fill(null).map((_, x) => {
      if (x === 0 && y === 0) return CellType.START;
      if (x === 9 && y === 9) return CellType.GOAL;
      if (x === 4 && y === 4) return CellType.HAZARD;
      if (x === 5 && y === 5) return CellType.WALL;
      if (Math.random() < 0.1 && !(x===0 && y===0) && !(x===9 && y===9)) return CellType.HAZARD;
      return CellType.EMPTY;
    })
  )
};

const INITIAL_PARAMS: AgentParams = {
  alpha: 0.1,
  gamma: 0.9,
  epsilon: 1.0,
  epsilonDecay: 0.995,
  minEpsilon: 0.01
};

const App: React.FC = () => {
  // State
  const [gridConfig, setGridConfig] = useState<GridConfig>(INITIAL_GRID);
  const [agentParams, setAgentParams] = useState<AgentParams>(INITIAL_PARAMS);
  const [isTraining, setIsTraining] = useState(false);
  const [speed, setSpeed] = useState(50); // ms delay
  const [history, setHistory] = useState<EpisodeHistory[]>([]);
  const [episodeCount, setEpisodeCount] = useState(0);
  const [agentState, setAgentState] = useState<AgentState>({ x: 0, y: 0 });
  
  // Gemini Integration State
  const [mapPrompt, setMapPrompt] = useState("一个中间有宝藏房间被火焰包围的迷宫。");
  const [isGeneratingMap, setIsGeneratingMap] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Refs for mutable logic outside React render cycle
  const agentRef = useRef<QLearningAgent>(new QLearningAgent(INITIAL_GRID, INITIAL_PARAMS));
  // Use ReturnType<typeof setInterval> to be environment agnostic (Node vs Browser)
  const trainingLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentEpisodeReward = useRef(0);
  const currentEpisodeSteps = useRef(0);

  // Update Agent Ref when Grid Changes
  useEffect(() => {
    agentRef.current.setMap(gridConfig);
    setAgentState(agentRef.current.getState());
    setHistory([]);
    setEpisodeCount(0);
    setAgentParams(prev => ({...prev, epsilon: 1.0})); // Reset epsilon on new map
  }, [gridConfig]);

  // Update Agent Params when State Changes
  useEffect(() => {
    agentRef.current.updateParams(agentParams);
  }, [agentParams]);

  const step = useCallback(() => {
    const agent = agentRef.current;
    const action = agent.chooseAction();
    const { reward, done } = agent.step(action);

    currentEpisodeReward.current += reward;
    currentEpisodeSteps.current += 1;
    setAgentState(agent.getState());

    if (done) {
      // Episode complete
      const newEpisodeData: EpisodeHistory = {
        episode: episodeCount + 1,
        reward: currentEpisodeReward.current,
        steps: currentEpisodeSteps.current
      };

      setHistory(prev => [...prev, newEpisodeData]);
      setEpisodeCount(prev => prev + 1);
      
      // Decay Epsilon
      agent.decayEpsilon();
      setAgentParams(agent.getParams());

      // Reset for next episode
      agent.resetPosition();
      currentEpisodeReward.current = 0;
      currentEpisodeSteps.current = 0;
      setAgentState(agent.getState());
    }
  }, [episodeCount]);

  // Training Loop
  useEffect(() => {
    if (isTraining) {
      trainingLoopRef.current = setInterval(step, speed);
    } else {
      if (trainingLoopRef.current) clearInterval(trainingLoopRef.current);
    }
    return () => {
      if (trainingLoopRef.current) clearInterval(trainingLoopRef.current);
    };
  }, [isTraining, speed, step]);

  const handleParamChange = (key: keyof AgentParams, value: number) => {
    setAgentParams(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setIsTraining(false);
    agentRef.current = new QLearningAgent(gridConfig, INITIAL_PARAMS);
    setAgentParams(INITIAL_PARAMS);
    setHistory([]);
    setEpisodeCount(0);
    setAgentState(agentRef.current.getState());
    currentEpisodeReward.current = 0;
    currentEpisodeSteps.current = 0;
  };

  const handleGenerateMap = async () => {
    if (!process.env.API_KEY) {
        alert("未检测到 API Key。");
        return;
    }
    setIsGeneratingMap(true);
    handleReset(); // Stop everything
    const newGrid = await generateMap(mapPrompt);
    if (newGrid) {
      setGridConfig(newGrid);
    }
    setIsGeneratingMap(false);
  };

  const handleAnalyze = async () => {
    if (!process.env.API_KEY) return;
    setIsAnalyzing(true);
    const text = await analyzePerformance(history, agentParams);
    setAiAnalysis(text);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans">
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
            NeuroGrid
          </h1>
          <p className="text-slate-400 mt-1">强化学习可视化环境</p>
        </div>
        <div className="flex items-center gap-4 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
          <div className="text-center">
            <div className="text-xs text-slate-400 uppercase tracking-wider">回合数</div>
            <div className="text-xl font-mono font-bold text-white">{episodeCount}</div>
          </div>
          <div className="w-px h-8 bg-slate-700"></div>
          <div className="text-center">
            <div className="text-xs text-slate-400 uppercase tracking-wider">当前 ε</div>
            <div className="text-xl font-mono font-bold text-purple-400">{agentParams.epsilon.toFixed(3)}</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Controls & AI Chat */}
        <div className="lg:col-span-4 space-y-6">
          <ControlPanel 
            params={agentParams} 
            onParamChange={handleParamChange}
            speed={speed}
            setSpeed={setSpeed}
            isTraining={isTraining}
            onToggleTraining={() => setIsTraining(!isTraining)}
            onReset={handleReset}
          />

          {/* Map Generator */}
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg">
             <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
               🧬 AI 地图生成器
             </h2>
             <textarea 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-300 focus:outline-none focus:border-cyan-500 transition-colors mb-3"
                rows={3}
                value={mapPrompt}
                onChange={(e) => setMapPrompt(e.target.value)}
                placeholder="描述地图布局..."
             />
             <button 
                onClick={handleGenerateMap}
                disabled={isGeneratingMap}
                className="w-full py-2 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border border-purple-500/50 font-semibold transition-all flex justify-center items-center gap-2"
             >
                {isGeneratingMap ? (
                    <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                ) : '生成世界'}
             </button>
          </div>

          {/* AI Analysis */}
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg">
             <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  🔬 策略分析
                </h2>
                <button 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || history.length === 0}
                    className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
                >
                    {isAnalyzing ? '思考中...' : '分析'}
                </button>
             </div>
             <div className="bg-slate-900 rounded-lg p-3 border border-slate-700 min-h-[100px] text-sm text-slate-300 leading-relaxed">
                {aiAnalysis ? aiAnalysis : <span className="text-slate-600 italic">运行训练后点击分析以获取 AI 反馈。</span>}
             </div>
          </div>
        </div>

        {/* Center Column: Grid & Stats */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-800/50 p-1 rounded-xl border border-slate-700 shadow-2xl backdrop-blur-sm">
            <Grid 
                config={gridConfig} 
                agentState={agentState} 
                agent={agentRef.current} 
                showQValues={true}
            />
          </div>
          <Charts history={history} />
        </div>
      </main>
    </div>
  );
};

export default App;