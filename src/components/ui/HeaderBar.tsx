import React, { useState } from 'react';
import { 
  SimulationEngine 
} from '../../engine/simulationEngine';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Sparkles, 
  FlaskConical, 
  CalendarClock, 
  Download, 
  Cpu, 
  Layers,
  Focus,
  Scale,
  Zap
} from 'lucide-react';

interface HeaderBarProps {
  engine: SimulationEngine;
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  speed: number;
  setSpeed: (speed: number) => void;
  onReset: () => void;
  onStep: () => void;
  onOpenWhatIf: () => void;
  onOpenBeforeVsAi: () => void;
  onOpenTimetable: () => void;
  onFollowCongestion: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  engine,
  isRunning,
  setIsRunning,
  speed,
  setSpeed,
  onReset,
  onStep,
  onOpenWhatIf,
  onOpenBeforeVsAi,
  onOpenTimetable,
  onFollowCongestion,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const speedOptions = [0.5, 1.0, 2.0, 5.0, 10.0];

  const handleExportCSV = () => {
    const csv = engine.exportDataCSV ? engine.exportDataCSV() : '';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifttwin-telemetry-${Date.now()}.csv`;
    a.click();
    setShowExportMenu(false);
  };

  const handleExportJSON = () => {
    const json = JSON.stringify({
      config: engine.config,
      metrics: engine.metrics,
      elevators: engine.elevators,
      floors: engine.floors,
    }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifttwin-digital-twin-${Date.now()}.json`;
    a.click();
    setShowExportMenu(false);
  };

  return (
    <header className="h-16 px-4 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between z-30 select-none">
      {/* Brand & Digital Twin identity */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-indigo-600 p-[1px] shadow-lg shadow-cyan-500/20 flex items-center justify-center">
          <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center">
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold tracking-tight text-white font-mono flex items-center gap-1.5">
              LIFT<span className="text-cyan-400">TWIN</span>
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              7-FLOOR DIGITAL TWIN
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            AI College Elevator Simulation & Wait Time Optimizer
          </p>
        </div>
      </div>

      {/* Center Controls: Play/Pause, Step, Speed, Simulated Clock */}
      <div className="flex items-center gap-3.5 bg-slate-900/80 border border-slate-800/90 rounded-2xl px-3 py-1.5 shadow-inner">
        {/* Play/Pause */}
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all shadow-md ${
            isRunning
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
          }`}
          title={isRunning ? 'Pause Simulation' : 'Resume Simulation'}
        >
          {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          <span>{isRunning ? 'PAUSE' : 'PLAY'}</span>
        </button>

        {/* Step Forward */}
        <button
          onClick={onStep}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all"
          title="Step Forward (+2s)"
        >
          <FastForward className="w-4 h-4" />
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all"
          title="Reset Simulation State"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Speed multiplier selector: 0.5x, 1x, 2x, 5x, 10x */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
          {speedOptions.map(s => (
            <button
              key={s}
              onClick={() => {
                setSpeed(s);
                engine.config.timeScale = s;
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                speed === s
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Live Simulation Clock */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
          <CalendarClock className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs font-bold text-white tracking-wider">
            {engine.metrics.simulatedClockTime}
          </span>
        </div>
      </div>

      {/* Right Controls: What-If, Before vs AI, Timetable, Export */}
      <div className="flex items-center gap-2">
        {/* What-If Lab */}
        <button
          onClick={onOpenWhatIf}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <FlaskConical className="w-4 h-4 text-cyan-200" />
          <span>WHAT-IF LAB</span>
        </button>

        {/* Before vs AI Comparison Benchmark */}
        <button
          onClick={onOpenBeforeVsAi}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-all shadow-sm"
        >
          <Scale className="w-3.5 h-3.5 text-emerald-400" />
          <span>BEFORE VS AI</span>
        </button>

        {/* Timetable Schedule */}
        <button
          onClick={onOpenTimetable}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-all shadow-sm"
        >
          <CalendarClock className="w-3.5 h-3.5 text-indigo-400" />
          <span>CLASS TIMETABLE</span>
        </button>

        {/* Follow Congestion Button */}
        <button
          onClick={onFollowCongestion}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-all"
          title="Fly camera to worst congested floor"
        >
          <Focus className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">BOTTLENECK</span>
        </button>

        {/* Export */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-xl transition-all"
            title="Export Simulation Data"
          >
            <Download className="w-4 h-4" />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 text-xs">
              <button
                onClick={handleExportJSON}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 font-medium transition-all"
              >
                Export Digital Twin (JSON)
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
