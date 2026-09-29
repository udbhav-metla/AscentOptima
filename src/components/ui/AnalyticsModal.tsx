import React from 'react';
import { 
  SimulationEngine, 
  TOTAL_FLOORS 
} from '../../engine/simulationEngine';
import { 
  X, 
  TrendingUp, 
  Clock, 
  Users, 
  Gauge, 
  Zap, 
  Layers,
  ArrowRight
} from 'lucide-react';

interface AnalyticsModalProps {
  engine: SimulationEngine;
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  engine,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const metrics = engine.metrics;
  const history = metrics.history;

  // Compute maximum values for scaling SVG sparklines
  const maxWaiting = Math.max(...history.map(h => h.waitingCount), 10);
  const maxWaitTime = Math.max(...history.map(h => h.avgWaitTime), 30);

  const formatSec = (s: number) => {
    const mins = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return mins > 0 ? `${mins}m ${sec}s` : `${sec}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                REAL-TIME SIMULATION ANALYTICS & TELEMETRY
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Live metrics stream, floor demand distribution, and algorithmic efficiency gains.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* 1. Primary Comparison Table: Baseline vs AI Optimized */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-400" />
                Baseline vs AI Strategy Benchmark
              </span>
              <span className="text-emerald-400 font-bold font-mono">
                {Math.round(metrics.percentImprovement)}% REDUCTION IN WAIT
              </span>
            </div>

            <div className="grid grid-cols-4 gap-3 text-center pt-1 font-mono">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-sans mb-1">
                  Avg Wait Time
                </div>
                <div className="text-slate-400 line-through text-xs">
                  {formatSec(metrics.baselineAvgWaitSeconds)}
                </div>
                <div className="text-base font-bold text-cyan-300">
                  {formatSec(metrics.avgWaitSeconds)}
                </div>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-sans mb-1">
                  Total Time Saved
                </div>
                <div className="text-slate-400 text-xs">0 min (baseline)</div>
                <div className="text-base font-bold text-emerald-400">
                  {Math.round(metrics.totalStudentMinutesSaved).toLocaleString()} min
                </div>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-sans mb-1">
                  Fleet Utilization
                </div>
                <div className="text-slate-400 text-xs">~42% (idle clusters)</div>
                <div className="text-base font-bold text-indigo-300">
                  {Math.round(metrics.avgUtilization)}%
                </div>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-sans mb-1">
                  Students Served
                </div>
                <div className="text-slate-400 text-xs">In lift: {metrics.studentsInsideElevators}</div>
                <div className="text-base font-bold text-white">
                  {metrics.totalCompletedJourneys}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Charts: Crowd vs Time & Wait Time vs Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Crowd vs Time */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  Crowd in Queues vs Time
                </span>
                <span className="font-mono text-cyan-400 text-[11px]">
                  Current: {metrics.studentsWaiting}
                </span>
              </div>

              {/* Sparkline Canvas / SVG */}
              <div className="h-28 bg-slate-900/60 rounded-lg p-2 flex items-end">
                {history.length > 1 ? (
                  <svg className="w-full h-full overflow-visible">
                    <polyline
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2.5"
                      points={history.map((h, i) => {
                        const x = (i / Math.max(1, history.length - 1)) * 340;
                        const y = 90 - (h.waitingCount / Math.max(1, maxWaiting)) * 80;
                        return `${x},${y}`;
                      }).join(' ')}
                    />
                  </svg>
                ) : (
                  <div className="w-full text-center text-slate-500 text-[11px] pb-8">
                    Gathering telemetry samples...
                  </div>
                )}
              </div>
            </div>

            {/* Waiting Time vs Time */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Avg Wait Time vs Time
                </span>
                <span className="font-mono text-amber-400 text-[11px]">
                  Current: {formatSec(metrics.avgWaitSeconds)}
                </span>
              </div>

              <div className="h-28 bg-slate-900/60 rounded-lg p-2 flex items-end">
                {history.length > 1 ? (
                  <svg className="w-full h-full overflow-visible">
                    <polyline
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      points={history.map((h, i) => {
                        const x = (i / Math.max(1, history.length - 1)) * 340;
                        const y = 90 - (h.avgWaitTime / Math.max(1, maxWaitTime)) * 80;
                        return `${x},${y}`;
                      }).join(' ')}
                    />
                  </svg>
                ) : (
                  <div className="w-full text-center text-slate-500 text-[11px] pb-8">
                    Gathering telemetry samples...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Demand Distribution By Floor (7 floors down to Ground) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <span className="font-bold text-slate-200 uppercase tracking-wider block">
              Waiting Queue Breakdown by Floor
            </span>

            <div className="space-y-1.5">
              {[...engine.floors].reverse().map(floor => {
                const totalWaiting = floor.waitingUp.length + floor.waitingDown.length;
                const pct = Math.min(100, (totalWaiting / 40) * 100);

                return (
                  <div key={floor.floorNumber} className="flex items-center gap-3 text-[11px]">
                    <span className="w-16 font-mono font-bold text-slate-400 text-right">
                      {floor.label}
                    </span>

                    <div className="flex-1 bg-slate-900 h-3 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full transition-all ${
                          floor.congestionLevel === 'CRITICAL'
                            ? 'bg-rose-500'
                            : floor.congestionLevel === 'HIGH'
                            ? 'bg-amber-500'
                            : floor.congestionLevel === 'MEDIUM'
                            ? 'bg-yellow-400'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.max(2, pct)}%` }}
                      />
                    </div>

                    <div className="w-20 font-mono text-slate-300 flex items-center justify-between">
                      <span>{totalWaiting} wait</span>
                      <span className="text-slate-500 text-[10px]">
                        ({floor.waitingDown.length}↓ {floor.waitingUp.length}↑)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
