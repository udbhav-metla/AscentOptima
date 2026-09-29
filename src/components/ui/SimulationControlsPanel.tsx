import React from 'react';
import { 
  SimulationEngine 
} from '../../engine/simulationEngine';
import { 
  DestinationPattern, 
  DispatchStrategy 
} from '../../types/simulation';
import { 
  Sliders, 
  Users, 
  Gauge, 
  ArrowUpDown, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Zap,
  Footprints,
  Compass,
  Bot,
  Power
} from 'lucide-react';

interface SimulationControlsPanelProps {
  engine: SimulationEngine;
  onUpdate: () => void;
  selectedElevatorId: string | null;
  setSelectedElevatorId: (id: string | null) => void;
}

export const SimulationControlsPanel: React.FC<SimulationControlsPanelProps> = ({
  engine,
  onUpdate,
  selectedElevatorId,
  setSelectedElevatorId,
}) => {
  const config = engine.config;

  const handlePopulationChange = (val: number) => {
    config.studentPopulation = val;
    onUpdate();
  };

  const handleArrivalRateChange = (val: number) => {
    config.studentArrivalRate = val;
    onUpdate();
  };

  const handleElevatorCountChange = (count: number) => {
    engine.setElevatorCount(count);
    onUpdate();
  };

  const handleCapacityChange = (cap: number) => {
    engine.setElevatorCapacity(cap);
    onUpdate();
  };

  const handleElevatorSpeedChange = (spd: number) => {
    engine.setElevatorSpeed(spd);
    onUpdate();
  };

  const handleWalkingSpeedChange = (spd: number) => {
    config.walkingSpeed = spd;
    for (const a of engine.agents) {
      a.speed = spd * 0.95;
    }
    onUpdate();
  };

  const handlePeakMultiplierChange = (val: number) => {
    config.peakMultiplier = val;
    onUpdate();
  };

  const handlePatternChange = (pat: DestinationPattern) => {
    config.destinationPattern = pat;
    onUpdate();
  };

  const handleToggleAiDispatch = () => {
    engine.toggleAiDispatch();
    onUpdate();
  };

  const handleToggleLift = (liftId: string) => {
    engine.toggleElevatorStatus(liftId);
    onUpdate();
  };

  return (
    <div className="w-80 h-full bg-slate-950/95 backdrop-blur-md border-r border-slate-800/80 p-3.5 flex flex-col gap-3.5 overflow-y-auto z-20 select-none custom-scrollbar text-xs">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h2 className="font-bold text-slate-100 tracking-wide uppercase text-xs">
            Simulation Control
          </h2>
        </div>
        <span className="text-[10px] text-cyan-400 font-mono font-medium px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60">
          PHYSICAL TWIN
        </span>
      </div>

      {/* 1. AI Dispatch Engine Master Switch */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-cyan-400" />
          <div>
            <div className="font-bold text-slate-200 text-xs">AI Predictive Dispatch</div>
            <div className="text-[10px] text-slate-400">Pre-positions cars ahead of class bells</div>
          </div>
        </div>

        <button
          onClick={handleToggleAiDispatch}
          className={`w-10 h-5.5 rounded-full transition-colors relative p-0.5 ${
            config.aiDispatchEnabled ? 'bg-emerald-500' : 'bg-slate-700'
          }`}
        >
          <span
            className={`block w-4.5 h-4.5 rounded-full bg-white transition-transform ${
              config.aiDispatchEnabled ? 'translate-x-4.5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* 2. Population & Crowd Demand Sliders */}
      <div className="space-y-3 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
        {/* Student Population in 3D World (10 to 500) */}
        <div className="flex items-center justify-between text-slate-300 font-semibold text-[11px]">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            Active Student Population
          </span>
          <span className="font-mono text-cyan-300 font-bold">
            {config.studentPopulation} bots
          </span>
        </div>
        <input
          type="range"
          min="10"
          max="350"
          step="10"
          value={config.studentPopulation}
          onChange={(e) => handlePopulationChange(parseInt(e.target.value))}
          className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />

        {/* Student Arrival Rate */}
        <div className="flex items-center justify-between text-slate-300 font-semibold text-[11px] pt-1">
          <span className="flex items-center gap-1.5">
            <Footprints className="w-3.5 h-3.5 text-emerald-400" />
            Arrival Rate
          </span>
          <span className="font-mono text-emerald-300 font-bold">
            {config.studentArrivalRate} /min
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="150"
          step="5"
          value={config.studentArrivalRate}
          onChange={(e) => handleArrivalRateChange(parseInt(e.target.value))}
          className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />

        {/* Walking Speed */}
        <div className="flex items-center justify-between text-slate-300 font-semibold text-[11px] pt-1">
          <span className="flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-indigo-400" />
            Bot Walking Speed
          </span>
          <span className="font-mono text-indigo-300 font-bold">
            {config.walkingSpeed.toFixed(1)} m/s
          </span>
        </div>
        <input
          type="range"
          min="1.0"
          max="2.5"
          step="0.1"
          value={config.walkingSpeed}
          onChange={(e) => handleWalkingSpeedChange(parseFloat(e.target.value))}
          className="w-full accent-indigo-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />

        {/* Peak Surge Multiplier */}
        <div className="flex items-center justify-between text-slate-300 font-semibold text-[11px] pt-1">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Peak Rush Multiplier
          </span>
          <span className="font-mono text-amber-300 font-bold">
            {config.peakMultiplier.toFixed(1)}x
          </span>
        </div>
        <input
          type="range"
          min="0.5"
          max="3.5"
          step="0.1"
          value={config.peakMultiplier}
          onChange={(e) => handlePeakMultiplierChange(parseFloat(e.target.value))}
          className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />

        {/* Flow Pattern */}
        <div className="pt-1">
          <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1.5">
            Campus Flow Distribution
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'UNIFORM', label: 'Uniform' },
              { id: 'UPPER_HEAVY', label: 'Upper Floors' },
              { id: 'GROUND_HEAVY', label: 'Ground Rush' },
              { id: 'MIDDLE_HEAVY', label: 'Mid Floors' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => handlePatternChange(p.id as DestinationPattern)}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold border transition-all text-center ${
                  config.destinationPattern === p.id
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:bg-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Elevator Fleet Configuration */}
      <div className="space-y-3 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
        {/* Active Elevators (1 to 5) */}
        <div className="flex items-center justify-between text-slate-300 font-semibold text-[11px]">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Number of Elevators
          </span>
          <span className="font-mono text-cyan-300 font-bold">
            {config.numElevators} cars
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={config.numElevators}
          onChange={(e) => handleElevatorCountChange(parseInt(e.target.value))}
          className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />

        {/* Capacity (4 to 20) */}
        <div className="flex items-center justify-between text-slate-300 font-semibold text-[11px] pt-1">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            Elevator Capacity
          </span>
          <span className="font-mono text-emerald-300 font-bold">
            {config.elevatorCapacity} people
          </span>
        </div>
        <input
          type="range"
          min="4"
          max="20"
          step="1"
          value={config.elevatorCapacity}
          onChange={(e) => handleCapacityChange(parseInt(e.target.value))}
          className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />

        {/* Speed (0.8 to 2.8) */}
        <div className="flex items-center justify-between text-slate-300 font-semibold text-[11px] pt-1">
          <span className="flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-indigo-400" />
            Elevator Speed
          </span>
          <span className="font-mono text-indigo-300 font-bold">
            {config.elevatorSpeed.toFixed(1)} flr/s
          </span>
        </div>
        <input
          type="range"
          min="0.8"
          max="2.8"
          step="0.1"
          value={config.elevatorSpeed}
          onChange={(e) => handleElevatorSpeedChange(parseFloat(e.target.value))}
          className="w-full accent-indigo-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
      </div>

      {/* 4. Elevator Failure & Fleet Status */}
      <div className="space-y-2 flex-1">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <span>Fleet & Failure Simulation</span>
          <span className="text-[10px] text-slate-500">{engine.elevators.length} Total</span>
        </div>

        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
          {engine.elevators.map(lift => {
            const isSelected = selectedElevatorId === lift.id;
            return (
              <div
                key={lift.id}
                onClick={() => setSelectedElevatorId(lift.id)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        !lift.enabled
                          ? 'bg-rose-500 animate-pulse'
                          : lift.direction === 'UP'
                          ? 'bg-emerald-400'
                          : lift.direction === 'DOWN'
                          ? 'bg-amber-400'
                          : 'bg-cyan-400'
                      }`}
                    />
                    <span className="font-bold text-slate-200 text-xs">{lift.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Floor {Math.round(lift.currentFloor)}
                    </span>
                  </div>

                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                      !lift.enabled
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : lift.direction === 'IDLE'
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-cyan-500/20 text-cyan-300'
                    }`}
                  >
                    {!lift.enabled ? 'FAILED' : lift.direction}
                  </span>
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 mb-1.5">
                  <span>Occupancy: {lift.passengers.length} / {lift.capacity}</span>
                  <span>Trips: {lift.tripsCompleted}</span>
                </div>

                {/* Fail Elevator Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleLift(lift.id);
                  }}
                  className={`w-full py-1 rounded-lg text-[10px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    lift.enabled
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                  }`}
                >
                  {lift.enabled ? (
                    <>
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      SIMULATE FAILURE (FAIL CAR)
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      RESTORE ELEVATOR
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
