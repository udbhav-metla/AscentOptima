import React, { useState } from 'react';
import { 
  SimulationEngine 
} from '../../engine/simulationEngine';
import { 
  X, 
  Users, 
  Clock, 
  ArrowUp, 
  ArrowDown, 
  Bell, 
  TrendingUp, 
  Building2,
  Compass
} from 'lucide-react';

interface FloorInspectorModalProps {
  engine: SimulationEngine;
  floorNumber: number | null;
  onClose: () => void;
  onTriggerCrowd: (floor: number, count: number) => void;
}

export const FloorInspectorModal: React.FC<FloorInspectorModalProps> = ({
  engine,
  floorNumber,
  onClose,
  onTriggerCrowd,
}) => {
  const [releaseCount, setReleaseCount] = useState<number>(60);

  if (floorNumber === null) return null;

  const floor = engine.floors[floorNumber];
  if (!floor) return null;

  const totalWaiting = floor.waitingUp.length + floor.waitingDown.length;

  // Destination breakdown calculation
  const destCounts: Record<number, number> = {};
  for (const p of [...floor.waitingUp, ...floor.waitingDown]) {
    destCounts[p.destinationFloor] = (destCounts[p.destinationFloor] || 0) + 1;
  }

  const formatSec = (s: number) => {
    const mins = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return mins > 0 ? `${mins}m ${sec}s` : `${sec}s`;
  };

  const handleRelease = () => {
    engine.triggerClassRelease(floorNumber, releaseCount, 'GROUND_HEAVY');
    onTriggerCrowd(floorNumber, releaseCount);
  };

  return (
    <div className="absolute top-20 right-88 z-30 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden select-none text-xs">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-cyan-400" />
          <div>
            <h3 className="font-extrabold text-white text-sm">
              {floor.label} TELEMETRY
            </h3>
            <span className="text-[10px] text-slate-400">
              {floorNumber === 0 ? 'Main Lobby & Entrance' : 'Academic Classrooms & Labs'}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3.5">
        {/* Status badges */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium">Congestion Level:</span>
          <span
            className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
              floor.congestionLevel === 'CRITICAL'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                : floor.congestionLevel === 'HIGH'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : floor.congestionLevel === 'MEDIUM'
                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {floor.congestionLevel}
          </span>
        </div>

        {/* Key numbers grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-semibold mb-0.5 flex items-center gap-1">
              <Users className="w-3 h-3 text-cyan-400" />
              Waiting Lobby
            </div>
            <div className="font-mono text-base font-bold text-white">
              {totalWaiting}{' '}
              <span className="text-[10px] font-normal text-slate-400">people</span>
            </div>
            <div className="text-[9px] text-slate-500 mt-0.5 flex gap-2">
              <span className="flex items-center text-emerald-400">
                <ArrowUp className="w-2.5 h-2.5" /> {floor.waitingUp.length}
              </span>
              <span className="flex items-center text-amber-400">
                <ArrowDown className="w-2.5 h-2.5" /> {floor.waitingDown.length}
              </span>
            </div>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-semibold mb-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              Average Wait
            </div>
            <div className="font-mono text-base font-bold text-amber-300">
              {formatSec(floor.avgWaitSeconds)}
            </div>
            <div className="text-[9px] text-slate-500 mt-0.5">
              Across all hall calls
            </div>
          </div>
        </div>

        {/* Destination breakdown */}
        <div>
          <span className="text-[11px] font-semibold text-slate-300 block mb-1.5 flex items-center gap-1">
            <Compass className="w-3 h-3 text-indigo-400" />
            Passenger Destination Breakdown
          </span>

          <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
            {Object.keys(destCounts).length === 0 ? (
              <span className="text-slate-500 text-[10px]">No active passengers queued</span>
            ) : (
              Object.entries(destCounts).map(([dest, count]) => (
                <span
                  key={dest}
                  className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[10px] text-slate-200"
                >
                  {parseInt(dest) === 0 ? 'Ground' : `F${dest}`}:{' '}
                  <strong className="text-cyan-400 font-bold">{count}</strong>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Interactive Action: Release Crowd on this Floor */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-semibold">Simulate Class Dismissal:</span>
            <span className="font-mono text-cyan-300 font-bold">{releaseCount} students</span>
          </div>

          <input
            type="range"
            min="20"
            max="120"
            step="10"
            value={releaseCount}
            onChange={(e) => setReleaseCount(parseInt(e.target.value))}
            className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />

          <button
            onClick={handleRelease}
            className="w-full py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Bell className="w-3.5 h-3.5 fill-current" />
            DISMISS CLASS ON {floor.label} NOW
          </button>
        </div>
      </div>
    </div>
  );
};
