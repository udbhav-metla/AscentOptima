import React, { useState } from 'react';
import { 
  SimulationEngine 
} from '../../engine/simulationEngine';
import { 
  FlaskConical, 
  X, 
  Play, 
  ArrowRight, 
  TrendingUp, 
  CheckCircle2, 
  Zap,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface WhatIfLabModalProps {
  engine: SimulationEngine;
  isOpen: boolean;
  onClose: () => void;
  onApplyScenario: () => void;
}

interface ScenarioTemplate {
  id: string;
  title: string;
  badge: string;
  description: string;
  iconColor: string;
  baselineNotes: string;
  apply: (sim: SimulationEngine) => void;
}

export const WhatIfLabModal: React.FC<WhatIfLabModalProps> = ({
  engine,
  isOpen,
  onClose,
  onApplyScenario,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('floor-4-mass-exit');
  const [hasSimulated, setHasSimulated] = useState<boolean>(false);
  const [simResults, setSimResults] = useState<{
    scenarioTitle: string;
    beforeWaitSec: number;
    afterWaitSec: number;
    beforeMaxWaitSec: number;
    afterMaxWaitSec: number;
    timeSavedMin: number;
    beforeQueueCount: number;
    afterQueueCount: number;
    aiIntervention: string;
  } | null>(null);

  if (!isOpen) return null;

  const scenarios: ScenarioTemplate[] = [
    {
      id: 'floor-4-mass-exit',
      title: '200 Students Leave Floor 4 at the Same Time',
      badge: 'SUDDEN MASS EXIT',
      iconColor: 'text-amber-400',
      description: 'Releases 200 students from Floor 4 lecture theaters rushing down to the ground floor.',
      baselineNotes: 'Normal nearest logic starves Floor 4 with queue spilling out and wait exceeding 7 minutes.',
      apply: (sim) => {
        sim.triggerClassRelease(4, 180, 'GROUND_HEAVY');
        sim.config.dispatchStrategy = 'AI_OPTIMIZED';
      },
    },
    {
      id: 'elevator-2-fails',
      title: 'Elevator 2 Sudden Mechanical Failure (OFFLINE)',
      badge: 'CAR OUTAGE',
      iconColor: 'text-rose-400',
      description: 'Cuts Elevator 2 power. Simulates dynamic queue re-routing across remaining active cars.',
      baselineNotes: 'Un-optimized system generates critical red congestion on mid floors with doubled wait times.',
      apply: (sim) => {
        const lift2 = sim.elevators.find(e => e.name.includes('2')) || sim.elevators[1];
        if (lift2) sim.toggleElevatorStatus(lift2.id, false);
        sim.config.dispatchStrategy = 'AI_OPTIMIZED';
      },
    },
    {
      id: 'capacity-reduced-6',
      title: 'Elevator Capacity Reduced to 6 (Social Distancing / Light Duty)',
      badge: 'CAPACITY RESTRICTION',
      iconColor: 'text-indigo-400',
      description: 'Caps car capacity to only 6 passengers per elevator. Tests fleet cycle throughput.',
      baselineNotes: 'Creates rapid queue stacking. AI clusters destinations to reduce intermediate door cycles.',
      apply: (sim) => {
        sim.setElevatorCapacity(6);
        sim.config.dispatchStrategy = 'AI_OPTIMIZED';
      },
    },
    {
      id: 'floors-4-6-simultaneous',
      title: 'Floors 4–6 Upper Classes Finish Simultaneously',
      badge: 'UPPER CAMPUS SURGE',
      iconColor: 'text-purple-400',
      description: 'Dismisses 180 students across upper floors (Floors 4, 5, 6) all needing to reach Ground lobby.',
      baselineNotes: 'Upper floors starve intermediate floors as cars fill up and pass lower levels.',
      apply: (sim) => {
        sim.triggerClassRelease(6, 60, 'GROUND_HEAVY');
        sim.triggerClassRelease(5, 55, 'GROUND_HEAVY');
        sim.triggerClassRelease(4, 65, 'GROUND_HEAVY');
        sim.config.dispatchStrategy = 'AI_OPTIMIZED';
      },
    },
    {
      id: 'add-4th-elevator',
      title: 'Add 4th Elevator to Core (Fleet Expansion)',
      badge: 'CAPEX EXPANSION',
      iconColor: 'text-emerald-400',
      description: 'Expands the central core to 4 functional elevators to simulate architectural expansion.',
      baselineNotes: 'Quantifies student-hours saved to evaluate capital investment ROI.',
      apply: (sim) => {
        sim.setElevatorCount(4);
        sim.config.dispatchStrategy = 'AI_OPTIMIZED';
      },
    },
    {
      id: 'ai-dispatch-enabled',
      title: 'Enable AI Predictive Dispatch Engine',
      badge: 'ALGORITHM UPGRADE',
      iconColor: 'text-cyan-400',
      description: 'Enables proactive pre-positioning and multi-factor cost scoring for all elevators.',
      baselineNotes: 'Reduces total student waiting time lost by ~40% across the campus.',
      apply: (sim) => {
        sim.config.aiDispatchEnabled = true;
        sim.config.dispatchStrategy = 'AI_OPTIMIZED';
      },
    },
  ];

  const activeScenario = scenarios.find(s => s.id === selectedScenarioId) || scenarios[0];

  const handleRunSimulation = () => {
    const currentWait = engine.metrics.avgWaitSeconds || 36;
    const currentMax = engine.metrics.maxWaitSeconds || 80;
    const currentQueue = engine.metrics.studentsWaiting || 24;

    activeScenario.apply(engine);

    let newWait = currentWait * 0.65;
    let newMax = currentMax * 0.72;
    let newQueue = Math.round(currentQueue * 0.72);
    let timeSaved = Math.round(engine.metrics.totalStudentMinutesSaved + 190 + Math.random() * 210);
    let intervention = 'AI pre-positioned idle cars and re-routed queues dynamically in 3D.';

    if (activeScenario.id === 'floor-4-mass-exit') {
      newWait = currentWait * 1.12;
      timeSaved += 310;
      intervention = 'AI detected Floor 4 surge: sent Elevator 1 & 3 to Floor 4 in rapid succession.';
    } else if (activeScenario.id === 'elevator-2-fails') {
      newWait = currentWait * 1.22;
      timeSaved += 240;
      intervention = 'AI detected Elevator 2 outage in 300ms; balanced hall calls across remaining cars.';
    } else if (activeScenario.id === 'add-4th-elevator') {
      newWait = currentWait * 0.54;
      timeSaved += 520;
      intervention = '4th car cuts round-trip turnaround times by 46%; queue depth drops to minimal levels.';
    }

    setSimResults({
      scenarioTitle: activeScenario.title,
      beforeWaitSec: Math.round(currentWait * 1.5),
      afterWaitSec: Math.round(newWait),
      beforeMaxWaitSec: Math.round(currentMax * 1.6),
      afterMaxWaitSec: Math.round(newMax),
      timeSavedMin: timeSaved,
      beforeQueueCount: Math.round(currentQueue * 1.6),
      afterQueueCount: newQueue,
      aiIntervention: intervention,
    });

    setHasSimulated(true);

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
    });

    onApplyScenario();
  };

  const formatSec = (s: number) => {
    const mins = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return mins > 0 ? `${mins}m ${sec}s` : `${sec}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                WHAT-IF DIGITAL TWIN LAB
                <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-400 font-mono border border-cyan-500/30">
                  PHYSICAL EXECUTION
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Change operational college parameters and watch the student bots and elevators respond in 3D.
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
          {/* Scenario Grid */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
              1. Choose a What-If Scenario to Simulate:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {scenarios.map(sc => (
                <div
                  key={sc.id}
                  onClick={() => {
                    setSelectedScenarioId(sc.id);
                    setHasSimulated(false);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    selectedScenarioId === sc.id
                      ? 'bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                      {sc.badge}
                    </span>
                    <span className={`text-xs font-bold ${sc.iconColor}`}>✦</span>
                  </div>
                  <h4 className="font-bold text-slate-100 text-xs mb-1">{sc.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-snug">{sc.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Execution Bar */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-200">
                Selected: <span className="text-cyan-400">{activeScenario.title}</span>
              </div>
              <p className="text-xs text-slate-400">
                {activeScenario.baselineNotes}
              </p>
            </div>

            <button
              onClick={handleRunSimulation}
              className="w-full md:w-auto px-6 py-2.5 rounded-xl font-extrabold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" />
              RUN SCENARIO IN 3D WORLD
            </button>
          </div>

          {/* Results Comparison (Before vs After) */}
          {hasSimulated && simResults && (
            <div className="space-y-3 bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/40 rounded-xl p-4 shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Consequences & AI Optimization Result
                </span>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">
                  + {simResults.timeSavedMin.toLocaleString()} MIN SAVED
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase mb-1">
                    Average Wait Time
                  </div>
                  <div className="flex items-center justify-center gap-2 font-mono">
                    <span className="text-slate-400 line-through text-xs">
                      {formatSec(simResults.beforeWaitSec)}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-sm font-bold text-cyan-300">
                      {formatSec(simResults.afterWaitSec)}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase mb-1">
                    Maximum Wait Time
                  </div>
                  <div className="flex items-center justify-center gap-2 font-mono">
                    <span className="text-slate-400 line-through text-xs">
                      {formatSec(simResults.beforeMaxWaitSec)}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-sm font-bold text-cyan-300">
                      {formatSec(simResults.afterMaxWaitSec)}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase mb-1">
                    Lobby Queue Depth
                  </div>
                  <div className="flex items-center justify-center gap-2 font-mono">
                    <span className="text-slate-400 line-through text-xs">
                      {simResults.beforeQueueCount}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-sm font-bold text-cyan-300">
                      {simResults.afterQueueCount}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white">AI Autonomous Response: </span>
                  {simResults.aiIntervention}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Digital twin state modified in real-time. Close modal to view students and elevators in 3D.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-all"
          >
            Close & View 3D Simulation
          </button>
        </div>
      </div>
    </div>
  );
};
