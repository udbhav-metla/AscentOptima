import React, { useState } from 'react';
import { 
  SimulationEngine, 
  TOTAL_FLOORS 
} from '../../engine/simulationEngine';
import { 
  Bot, 
  AlertCircle, 
  Clock, 
  Footprints, 
  Sparkles, 
  Compass, 
  ShieldAlert, 
  ChevronRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { RouteOption } from '../../types/simulation';

interface AiCommandCenterProps {
  engine: SimulationEngine;
  onSelectFloor: (floor: number) => void;
}

export const AiCommandCenter: React.FC<AiCommandCenterProps> = ({
  engine,
  onSelectFloor,
}) => {
  const prediction = engine.prediction;
  const advisories = engine.advisories;

  // Route Advisor State
  const [routeFrom, setRouteFrom] = useState<number>(6);
  const [routeTo, setRouteTo] = useState<number>(0);

  const routeResult = engine.calculateRoute(routeFrom, routeTo);

  const formatSec = (s: number) => {
    const mins = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return mins > 0 ? `${mins}m ${sec}s` : `${sec}s`;
  };

  return (
    <div className="w-84 h-full bg-slate-950/95 backdrop-blur-md border-l border-slate-800/80 p-3.5 flex flex-col gap-3.5 overflow-y-auto z-20 select-none custom-scrollbar text-xs">
      {/* AI Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-slate-100 tracking-wide uppercase text-xs">
              AI Command Center
            </h2>
            <div className="text-[10px] text-indigo-300 font-mono">
              AUTONOMOUS ADVISORY
            </div>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          OPTIMIZING
        </span>
      </div>

      {/* 1. Crowd Congestion Prediction Card */}
      <div className="bg-slate-900/70 border border-slate-800/90 rounded-xl p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            Crowd Risk Forecast
          </span>
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider font-mono ${
              prediction.riskLevel === 'CRITICAL'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                : prediction.riskLevel === 'HIGH'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {prediction.riskLevel} RISK
          </span>
        </div>

        {/* Prediction horizon grid */}
        <div className="grid grid-cols-4 gap-1.5 pt-1 text-center font-mono">
          <div className="bg-slate-950/80 p-1.5 rounded-lg border border-slate-800">
            <div className="text-[9px] text-slate-400">NOW</div>
            <div className="text-xs font-bold text-slate-200">
              {prediction.currentWaitingLobby}
            </div>
          </div>
          <div className="bg-slate-950/80 p-1.5 rounded-lg border border-slate-800">
            <div className="text-[9px] text-slate-400">+2m</div>
            <div className="text-xs font-bold text-cyan-300">
              {prediction.predictedWait2Min}
            </div>
          </div>
          <div className="bg-slate-950/80 p-1.5 rounded-lg border border-slate-800">
            <div className="text-[9px] text-slate-400">+5m</div>
            <div className="text-xs font-bold text-amber-300">
              {prediction.predictedWait5Min}
            </div>
          </div>
          <div className="bg-slate-950/80 p-1.5 rounded-lg border border-slate-800">
            <div className="text-[9px] text-slate-400">+10m</div>
            <div className="text-xs font-bold text-rose-300">
              {prediction.predictedWait10Min}
            </div>
          </div>
        </div>

        {/* Top hotspot floors */}
        <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between">
          <span>Bottleneck Floors:</span>
          <div className="flex gap-1.5">
            {prediction.topCongestedFloors.map((tf: { floor: number; expectedQueue: number }) => (
              <button
                key={tf.floor}
                onClick={() => onSelectFloor(tf.floor)}
                className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 hover:text-cyan-300 font-mono font-semibold"
              >
                {tf.floor === 0 ? 'G' : `F${tf.floor}`} ({tf.expectedQueue})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Student Route Recommendation (From Floor X to Floor Y) */}
      <div className="bg-slate-900/70 border border-slate-800/90 rounded-xl p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            Fastest Route Advisor
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold font-mono">
            Save {formatSec(routeResult.timeSavedSec)}
          </span>
        </div>

        {/* Selectors for Floor From -> To */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">From Floor:</label>
            <select
              value={routeFrom}
              onChange={(e) => setRouteFrom(parseInt(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
            >
              {Array.from({ length: TOTAL_FLOORS }, (_, i) => (
                <option key={i} value={i}>
                  {i === 0 ? 'Ground' : `Floor ${i}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Destination:</label>
            <select
              value={routeTo}
              onChange={(e) => setRouteTo(parseInt(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
            >
              {Array.from({ length: TOTAL_FLOORS }, (_, i) => (
                <option key={i} value={i}>
                  {i === 0 ? 'Ground' : `Floor ${i}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Evaluation list */}
        <div className="space-y-1.5 pt-1">
          {routeResult.options.map((opt: RouteOption) => (
            <div
              key={opt.name}
              className={`p-2 rounded-lg border flex items-center justify-between text-[11px] ${
                opt.isRecommended
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200 font-semibold'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {opt.name === 'Stairwell' ? (
                  <Footprints className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span>{opt.name}</span>
                {opt.isRecommended && (
                  <span className="px-1 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-bold ml-1">
                    FASTEST
                  </span>
                )}
              </div>

              <div className="font-mono text-right text-[10px]">
                <div className="text-slate-400">
                  Wait: {formatSec(opt.waitTimeSec)} | Run: {formatSec(opt.travelTimeSec)}
                </div>
                <div className="font-bold text-white">
                  Total: {formatSec(opt.totalTimeSec)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Real-Time Autonomous Advisory Stream */}
      <div className="flex-1 space-y-2 flex flex-col min-h-48">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            Live Advisory Feed
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {advisories.length} events
          </span>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto pr-1 max-h-56 custom-scrollbar">
          {advisories.map(adv => (
            <div
              key={adv.id}
              className={`p-2.5 rounded-xl border text-[11px] space-y-1 transition-all ${
                adv.category === 'ALERT'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                  : adv.category === 'PREDICTION'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  : adv.category === 'OPTIMIZATION'
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="font-bold opacity-80 uppercase tracking-wider">
                  [{adv.category}]
                </span>
                <span className="opacity-60">{adv.timestamp}</span>
              </div>

              <p className="font-medium leading-snug">{adv.message}</p>

              {adv.impactScore && (
                <div className="text-[10px] font-mono text-emerald-400 pt-0.5">
                  ✦ {adv.impactScore}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
