import React from 'react';
import { 
  SimulationEngine 
} from '../../engine/simulationEngine';
import { 
  DispatchStrategy 
} from '../../types/simulation';
import { 
  Clock, 
  Users, 
  Gauge, 
  Zap, 
  Footprints, 
  Layers, 
  ArrowDownRight,
  TrendingDown,
  AlertTriangle,
  Bot
} from 'lucide-react';

interface MetricsBarProps {
  engine: SimulationEngine;
  onStrategyChange: (strategy: DispatchStrategy) => void;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({
  engine,
  onStrategyChange,
}) => {
  const metrics = engine.metrics;
  const config = engine.config;

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return mins > 0 ? `${mins}m ${s}s` : `${s}s`;
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-2 flex items-center justify-between text-xs select-none">
      {/* Left: Primary KPI (Student Minutes Saved) */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 bg-gradient-to-r from-emerald-500/20 via-cyan-500/15 to-emerald-500/10 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl shadow-md shadow-emerald-500/10">
          <div className="p-1 rounded-lg bg-emerald-500/25 text-emerald-400">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400 flex items-center gap-1.5 font-mono">
              Student-Minutes Saved
              <span className="text-emerald-300 font-semibold">
                ({Math.round(metrics.percentImprovement)}% faster)
              </span>
            </div>
            <div className="text-base font-extrabold text-white font-mono leading-none">
              {Math.round(metrics.totalStudentMinutesSaved).toLocaleString()}{' '}
              <span className="text-xs font-semibold text-emerald-300">MINUTES</span>
            </div>
          </div>
        </div>

        {/* Average Wait Time */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/70 border border-slate-800/90 rounded-xl">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
              Average Wait
            </div>
            <div className="font-mono font-bold text-cyan-300 text-xs flex items-center gap-1">
              <span>{formatSeconds(metrics.avgWaitSeconds)}</span>
              <span className="text-slate-500 text-[10px] line-through">
                {formatSeconds(metrics.baselineAvgWaitSeconds)}
              </span>
            </div>
          </div>
        </div>

        {/* Longest Wait Time */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-950/70 border border-slate-800/90 rounded-xl">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
              Longest Wait
            </div>
            <div className="font-mono font-bold text-amber-300 text-xs">
              {formatSeconds(metrics.maxWaitSeconds)}
            </div>
          </div>
        </div>
      </div>

      {/* Center: Live Student Counts (In Building, Waiting, Moving, In Elevators) */}
      <div className="hidden md:flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-[11px]">
        <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-800">
          <span className="text-slate-400 text-[10px] uppercase font-sans">Students:</span>
          <span className="font-bold text-slate-100">{metrics.studentsInBuilding}</span>
        </div>

        <div className="flex items-center gap-1 pr-2.5 border-r border-slate-800">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-slate-400 text-[10px] font-sans">Wait:</span>
          <span className="font-bold text-amber-300">{metrics.studentsWaiting}</span>
        </div>

        <div className="flex items-center gap-1 pr-2.5 border-r border-slate-800">
          <Footprints className="w-3 h-3 text-cyan-400" />
          <span className="text-slate-400 text-[10px] font-sans">Move:</span>
          <span className="font-bold text-cyan-300">{metrics.studentsMoving}</span>
        </div>

        <div className="flex items-center gap-1">
          <Layers className="w-3 h-3 text-indigo-400" />
          <span className="text-slate-400 text-[10px] font-sans">In Lift:</span>
          <span className="font-bold text-indigo-300">{metrics.studentsInsideElevators}</span>
        </div>
      </div>

      {/* Right: Fleet Utilization & Strategy Selector */}
      <div className="flex items-center gap-3">
        {/* Fleet Utilization */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-950/70 border border-slate-800/90 rounded-xl">
          <Gauge className="w-3.5 h-3.5 text-cyan-400" />
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
              Elevator Utilization
            </div>
            <div className="font-mono font-bold text-cyan-300 text-xs">
              {Math.round(metrics.avgUtilization)}%
            </div>
          </div>
        </div>

        {/* Dispatch Strategy Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1">
          <Bot className="w-3.5 h-3.5 text-cyan-400" />
          <select
            value={config.dispatchStrategy}
            onChange={(e) => onStrategyChange(e.target.value as DispatchStrategy)}
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-xs font-semibold text-cyan-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="AI_OPTIMIZED" className="bg-slate-900 text-slate-100">
              AI Optimized (Predictive)
            </option>
            <option value="NORMAL" className="bg-slate-900 text-slate-100">
              Normal (Nearest Lift)
            </option>
            <option value="FCFS" className="bg-slate-900 text-slate-100">
              FCFS (First Come)
            </option>
          </select>
        </div>
      </div>
    </div>
  );
};
