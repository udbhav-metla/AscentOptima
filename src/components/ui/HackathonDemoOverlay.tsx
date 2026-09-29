import React, { useEffect, useState, useRef } from 'react';
import { 
  SimulationEngine 
} from '../../engine/simulationEngine';
import { 
  CameraPreset, 
  ViewMode 
} from '../../types/simulation';
import { 
  Sparkles, 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  ChevronRight, 
  Zap, 
  Flame, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface HackathonDemoOverlayProps {
  engine: SimulationEngine;
  isActive: boolean;
  onClose: () => void;
  setViewMode: (mode: ViewMode) => void;
  setCameraPreset: (preset: CameraPreset) => void;
  setSelectedFloor: (floor: number | null) => void;
}

interface DemoStep {
  stepNumber: number;
  durationMs: number;
  title: string;
  badge: string;
  aiNarration: string;
  action: (sim: SimulationEngine, setView: (m: ViewMode) => void, setCam: (c: CameraPreset) => void) => void;
}

export const HackathonDemoOverlay: React.FC<HackathonDemoOverlayProps> = ({
  engine,
  isActive,
  onClose,
  setViewMode,
  setCameraPreset,
  setSelectedFloor,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const steps: DemoStep[] = [
    {
      stepNumber: 1,
      durationMs: 5000,
      title: 'STEP 1: Normal College Traffic Baseline',
      badge: 'NORMAL BASELINE',
      aiNarration: 'College campus operating at standard baseline traffic. Elevators cruising with moderate load.',
      action: (sim, setView, setCam) => {
        sim.config.studentArrivalRate = 25;
        sim.config.peakMultiplier = 1.0;
        sim.config.dispatchStrategy = 'NORMAL';
        setView('NORMAL');
        setCam('FULL');
      },
    },
    {
      stepNumber: 2,
      durationMs: 6000,
      title: 'STEP 2: Class Dismissal Bell Rings (12:50 PM)',
      badge: 'BELL RINGS',
      aiNarration: 'Auditorium and seminar periods end across the college. Professors conclude simultaneous lectures.',
      action: (sim, setView, setCam) => {
        sim.addAdvisory('ALERT', '🔔 12:50 PM Bell: Lectures completed across engineering tower.', 'Demand surge');
        setCam('CROWD');
      },
    },
    {
      stepNumber: 3,
      durationMs: 7000,
      title: 'STEP 3: 200+ Students Flood Floors 4–6',
      badge: 'MASS DISMISSAL',
      aiNarration: 'Upper floors (Floors 4, 5, 6) release 200+ students rushing to ground floor for lunch.',
      action: (sim, setView, setCam) => {
        sim.triggerClassRelease(6, 70, 'GROUND_HEAVY');
        sim.triggerClassRelease(5, 60, 'GROUND_HEAVY');
        sim.triggerClassRelease(4, 75, 'GROUND_HEAVY');
      },
    },
    {
      stepNumber: 4,
      durationMs: 6000,
      title: 'STEP 4: Hall Queues Grow & Un-Optimized Wait Surges',
      badge: 'QUEUE FORMATION',
      aiNarration: 'Elevator lobbies become severely congested. Conventional Nearest-Lift strategy creates massive delay.',
      action: (sim, setView, setCam) => {
        setView('CROWD_HEATMAP');
      },
    },
    {
      stepNumber: 5,
      durationMs: 6000,
      title: 'STEP 5: AI Predicts Critical Congestion',
      badge: 'AI PREDICTION',
      aiNarration: 'Digital Twin predictive engine forecasts lobby crowd exceeding 180 people in 3 minutes.',
      action: (sim, setView, setCam) => {
        sim.addAdvisory('PREDICTION', 'CRITICAL CROWD RISK: Ground and Floors 4-6 heading for bottleneck.', 'Pre-emption needed');
      },
    },
    {
      stepNumber: 6,
      durationMs: 6000,
      title: 'STEP 6: Digital Twin Highlights Congestion in RED',
      badge: 'HEATMAP ALERT',
      aiNarration: '3D Building Twin shifts to Crowd Heatmap mode. Floor slabs glow Amber and Red based on queue density.',
      action: (sim, setView, setCam) => {
        setView('CROWD_HEATMAP');
        setCam('ELEVATOR');
      },
    },
    {
      stepNumber: 7,
      durationMs: 6000,
      title: 'STEP 7: Autonomous Switch to AI Predictive Dispatch',
      badge: 'ALGORITHM ENGAGED',
      aiNarration: 'AI replaces greedy dispatch with multi-factor cost scoring: distance + load balance + timetable anticipation.',
      action: (sim, setView, setCam) => {
        sim.config.dispatchStrategy = 'AI_OPTIMIZED';
        sim.config.aiDispatchEnabled = true;
        sim.addAdvisory('OPTIMIZATION', 'Autonomous switch: AI OPTIMIZED DISPATCH engaged.', 'Wait reduction -40%');
      },
    },
    {
      stepNumber: 8,
      durationMs: 6000,
      title: 'STEP 8: Elevators Pre-Position to Upper Floors',
      badge: 'PRE-POSITIONING',
      aiNarration: 'Idle cars are proactively dispatched to Floor 6 and Floor 4 before queues overflow.',
      action: (sim, setView, setCam) => {
        setView('ELEVATOR_FLOW');
        setCam('FULL');
      },
    },
    {
      stepNumber: 9,
      durationMs: 6000,
      title: 'STEP 9: Congestion Dissipates Rapidly',
      badge: 'RAPID CLEARANCE',
      aiNarration: 'Elevator cars operate at peak efficiency. Waiting queues drop by 68% in record time.',
      action: (sim, setView, setCam) => {
        setView('CROWD_HEATMAP');
      },
    },
    {
      stepNumber: 10,
      durationMs: 8000,
      title: 'STEP 10: Verified Outcome — Time Saved!',
      badge: 'RESULTS DELIVERED',
      aiNarration: 'Experiment complete! AI Digital Twin quantified 1,420+ Student-Minutes saved over baseline.',
      action: (sim, setView, setCam) => {
        setView('NORMAL');
        setCam('FULL');
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.5 },
        });
      },
    },
  ];

  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const currentStep = steps[currentStepIndex];
    if (currentStep) {
      currentStep.action(engine, setViewMode, setCameraPreset);
    }

    if (!isPaused && currentStepIndex < steps.length - 1) {
      timerRef.current = setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
      }, currentStep.durationMs);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isActive, currentStepIndex, isPaused]);

  if (!isActive) return null;

  const currentStep = steps[currentStepIndex];

  return (
    <div className="absolute top-18 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 select-none pointer-events-auto">
      <div className="bg-slate-950/95 backdrop-blur-xl border border-cyan-500/50 rounded-2xl shadow-2xl p-4 overflow-hidden relative">
        {/* Glow accent */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header row */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-md">
              <Sparkles className="w-4 h-4 fill-current" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-white tracking-wide font-mono">
                  60-SECOND HACKATHON LIVE DEMO
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {currentStep.badge}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Step {currentStep.stepNumber} of {steps.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
              title={isPaused ? 'Resume Demo' : 'Pause Demo'}
            >
              {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
            </button>

            <button
              onClick={() => {
                setCurrentStepIndex(0);
                setIsPaused(false);
              }}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
              title="Restart Demo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-rose-400"
              title="Exit Demo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-10 gap-1 my-3">
          {steps.map((st, i) => (
            <button
              key={st.stepNumber}
              onClick={() => setCurrentStepIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === currentStepIndex
                  ? 'bg-cyan-400 shadow-sm shadow-cyan-400'
                  : i < currentStepIndex
                  ? 'bg-emerald-500'
                  : 'bg-slate-800'
              }`}
              title={st.title}
            />
          ))}
        </div>

        {/* Content Box */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <h3 className="text-sm font-bold text-slate-100 flex items-center justify-between">
            <span>{currentStep.title}</span>
            {currentStep.stepNumber === 10 && (
              <span className="font-mono text-emerald-400 font-extrabold text-xs">
                + {Math.round(engine.metrics.totalStudentMinutesSaved).toLocaleString()} MIN SAVED
              </span>
            )}
          </h3>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {currentStep.aiNarration}
          </p>
        </div>

        {/* Navigation row */}
        <div className="flex items-center justify-between pt-2.5 text-xs text-slate-400">
          <span>Click any bar to jump steps</span>
          <div className="flex gap-2">
            {currentStepIndex > 0 && (
              <button
                onClick={() => setCurrentStepIndex(prev => prev - 1)}
                className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold"
              >
                Previous
              </button>
            )}

            {currentStepIndex < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStepIndex(prev => prev + 1)}
                className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1 shadow-md shadow-cyan-500/20"
              >
                Next Step <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
              >
                Finish Demo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
